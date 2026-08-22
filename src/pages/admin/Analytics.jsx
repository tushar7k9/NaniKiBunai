import React, { useState, useEffect, useMemo } from 'react'
import {
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingBag,
  FiCreditCard,
  FiUsers,
  FiPackage,
  FiClock,
} from 'react-icons/fi'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  LineChart,
  Line,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import * as adminService from '../../services/adminService'
import './Analytics.css'

// ── Ranges ──────────────────────────────────────────────────────
const RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '12m', label: '12M', days: 365 },
  { key: 'all', label: 'All', days: null },
]

// Colors aligned with the .adm-badge--* palette
const STATUS_COLORS = {
  pending: '#D4AF37',
  confirmed: '#8FBC8F',
  processing: '#4A90D9',
  shipped: '#5A3E85',
  delivered: '#2d8659',
  completed: '#1e5c3f',
  cancelled: '#c0392b',
  returned: '#8A4B08',
  refunded: '#9A8C82',
}

const DISRUPTION_COLORS = {
  cancelled: '#c0392b',
  returned: '#8A4B08',
  refunded: '#9A8C82',
}

const CATEGORY_COLORS = ['#C4896A', '#5A3E85', '#2d8659', '#D4AF37', '#4A90D9', '#8A4B08', '#9A8C82']

const OPEN_STATUSES = ['pending', 'confirmed', 'processing', 'shipped']

// ── Formatting helpers ──────────────────────────────────────────
const formatCurrency = (amount) =>
  `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`

const formatCompact = (amount) =>
  `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`

const formatDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Time bucketing (local time, avoids UTC day-shift for IST) ──
const bucketKey = (date, unit) => {
  const d = new Date(date)
  if (unit === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  if (unit === 'week') {
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const bucketLabel = (key, unit) => {
  if (unit === 'month') {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    })
  }
  const [y, m, d] = key.split('-')
  const label = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  return unit === 'week' ? `Wk ${label}` : label
}

const generateBuckets = (start, end, unit) => {
  const keys = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  if (unit === 'week') cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
  if (unit === 'month') cursor.setDate(1)

  const endTime = new Date(end).getTime()
  while (cursor.getTime() <= endTime && keys.length < 400) {
    keys.push(bucketKey(cursor, unit))
    if (unit === 'day') cursor.setDate(cursor.getDate() + 1)
    else if (unit === 'week') cursor.setDate(cursor.getDate() + 7)
    else cursor.setMonth(cursor.getMonth() + 1)
  }
  return keys
}

// When an order was disrupted: dedicated timestamp, or updated_at as an
// approximation for rows from before the timestamps migration
const disruptionDate = (order) => {
  if (order.status === 'cancelled') return { date: order.cancelled_at || order.updated_at, approx: !order.cancelled_at }
  if (order.status === 'returned') return { date: order.returned_at || order.updated_at, approx: !order.returned_at }
  if (order.status === 'refunded') return { date: order.refunded_at || order.updated_at, approx: !order.refunded_at }
  return null
}

const netRevenueOf = (list) =>
  list
    .filter((o) => !adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

// ── Small UI pieces ─────────────────────────────────────────────
const DeltaChip = ({ current, previous }) => {
  if (previous == null || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  if (!isFinite(pct)) return null
  const up = pct >= 0
  return (
    <span
      className={`adm-analytics__delta adm-analytics__delta--${up ? 'up' : 'down'}`}
      title="vs previous period"
    >
      {up ? <FiTrendingUp /> : <FiTrendingDown />}
      {Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
    </span>
  )
}

const ChartTooltip = ({ active, payload, label, valueFormatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="adm-analytics__tooltip">
      {label && <span className="adm-analytics__tooltip-label">{label}</span>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="adm-analytics__tooltip-row">
          <span
            className="adm-analytics__tooltip-dot"
            style={{ background: p.color || p.payload?.color || p.fill }}
          />
          <span className="adm-analytics__tooltip-name">{p.name}</span>
          <span className="adm-analytics__tooltip-value">
            {valueFormatter ? valueFormatter(p.value, p.dataKey || p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────
const Analytics = () => {
  const [range, setRange] = useState('all')
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [productMetric, setProductMetric] = useState('revenue')

  // Fetch everything once — range switching filters client-side (instant,
  // and lets disruptions be counted by event date, not order date)
  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ordersData, itemsData] = await Promise.all([
        adminService.getAnalyticsOrders(),
        adminService.getTopProductStats(),
      ])
      setOrders(ordersData)
      setOrderItems(itemsData)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const rangeDef = RANGES.find((r) => r.key === range)

  // Window boundaries: [rangeStart, now] and the equal-length previous window
  const { rangeStart, prevStart } = useMemo(() => {
    if (!rangeDef.days) return { rangeStart: null, prevStart: null }
    const ms = rangeDef.days * 24 * 60 * 60 * 1000
    return {
      rangeStart: new Date(Date.now() - ms),
      prevStart: new Date(Date.now() - 2 * ms),
    }
  }, [rangeDef])

  const inRange = useMemo(
    () => (rangeStart ? orders.filter((o) => new Date(o.created_at) >= rangeStart) : orders),
    [orders, rangeStart]
  )
  const inPrevRange = useMemo(
    () =>
      rangeStart
        ? orders.filter((o) => {
            const d = new Date(o.created_at)
            return d >= prevStart && d < rangeStart
          })
        : null,
    [orders, rangeStart, prevStart]
  )

  const itemsInRange = useMemo(
    () =>
      rangeStart
        ? orderItems.filter((i) => i.orders && new Date(i.orders.created_at) >= rangeStart)
        : orderItems,
    [orderItems, rangeStart]
  )
  const itemsInPrevRange = useMemo(
    () =>
      rangeStart
        ? orderItems.filter((i) => {
            if (!i.orders) return false
            const d = new Date(i.orders.created_at)
            return d >= prevStart && d < rangeStart
          })
        : null,
    [orderItems, rangeStart, prevStart]
  )

  // Adaptive bucket size
  const firstOrderDate = orders.length ? new Date(orders[0].created_at) : new Date()
  const chartStart = rangeStart || firstOrderDate
  const spanDays = Math.max(1, (Date.now() - chartStart.getTime()) / 86400000)
  const unit = spanDays <= 45 ? 'day' : spanDays <= 200 ? 'week' : 'month'

  // ── KPIs (with previous-period comparison) ──
  const kpis = useMemo(() => {
    const countable = inRange.filter((o) => !adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status))
    const revenue = netRevenueOf(inRange)
    const prevRevenue = inPrevRange ? netRevenueOf(inPrevRange) : null
    const prevCountable = inPrevRange
      ? inPrevRange.filter((o) => !adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status))
      : null

    const distinctCustomers = (list) => {
      const map = {}
      list.forEach((o) => {
        const key = (o.customer_email || '').toLowerCase() || o.user_id
        if (key) map[key] = (map[key] || 0) + 1
      })
      return map
    }
    const customerMap = distinctCustomers(inRange)
    const customers = Object.keys(customerMap).length
    const returning = Object.values(customerMap).filter((n) => n > 1).length

    const units = itemsInRange.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
    const prevUnits = itemsInPrevRange
      ? itemsInPrevRange.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
      : null

    return {
      revenue,
      prevRevenue,
      totalOrders: inRange.length,
      prevTotalOrders: inPrevRange ? inPrevRange.length : null,
      aov: countable.length ? revenue / countable.length : 0,
      prevAov:
        prevCountable && prevCountable.length ? prevRevenue / prevCountable.length : null,
      customers,
      prevCustomers: inPrevRange ? Object.keys(distinctCustomers(inPrevRange)).length : null,
      returningPct: customers ? Math.round((returning / customers) * 100) : 0,
      units,
      prevUnits,
      openOrders: inRange.filter((o) => OPEN_STATUSES.includes(o.status)).length,
    }
  }, [inRange, inPrevRange, itemsInRange, itemsInPrevRange])

  // ── Revenue + order count over time ──
  const revenueSeries = useMemo(() => {
    if (inRange.length === 0) return []
    const buckets = generateBuckets(chartStart, new Date(), unit)
    const map = Object.fromEntries(buckets.map((k) => [k, { revenue: 0, orders: 0 }]))

    inRange.forEach((o) => {
      const key = bucketKey(o.created_at, unit)
      if (!(key in map)) return
      map[key].orders += 1
      if (!adminService.REVENUE_EXCLUDED_STATUSES.includes(o.status)) {
        map[key].revenue += Number(o.total_amount || 0)
      }
    })
    return buckets.map((k) => ({ label: bucketLabel(k, unit), ...map[k] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange, unit, range])

  // ── Orders by status (donut + rates) ──
  const statusData = useMemo(() => {
    const counts = {}
    inRange.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    const total = inRange.length || 1
    return Object.keys(STATUS_COLORS)
      .filter((s) => counts[s])
      .map((s) => ({
        name: s,
        value: counts[s],
        pct: Math.round((counts[s] / total) * 100),
        color: STATUS_COLORS[s],
      }))
  }, [inRange])

  // ── Disruptions by EVENT date (scans all orders, not just in-range) ──
  const { disruptionSeries, hasDisruptions, hasApproxDates } = useMemo(() => {
    const buckets = generateBuckets(chartStart, new Date(), unit)
    const map = Object.fromEntries(
      buckets.map((k) => [k, { cancelled: 0, returned: 0, refunded: 0 }])
    )
    let approx = false

    orders.forEach((o) => {
      const event = disruptionDate(o)
      if (!event?.date) return
      if (rangeStart && new Date(event.date) < rangeStart) return
      const key = bucketKey(event.date, unit)
      if (key in map) {
        map[key][o.status] += 1
        if (event.approx) approx = true
      }
    })
    const series = buckets.map((k) => ({ label: bucketLabel(k, unit), ...map[k] }))
    return {
      disruptionSeries: series,
      hasDisruptions: series.some((d) => d.cancelled || d.returned || d.refunded),
      hasApproxDates: approx,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, rangeStart, unit, range])

  // ── Top products ──
  const topProducts = useMemo(() => {
    const byProduct = {}
    itemsInRange.forEach((item) => {
      const name = item.products?.name || item.product_snapshot?.name || 'Unknown product'
      const key = item.product_id ?? `snap:${name}`
      if (!byProduct[key]) byProduct[key] = { name, revenue: 0, quantity: 0 }
      byProduct[key].revenue += Number(item.total_price || 0)
      byProduct[key].quantity += Number(item.quantity || 0)
    })
    return Object.values(byProduct)
      .sort((a, b) => b[productMetric] - a[productMetric])
      .slice(0, 8)
  }, [itemsInRange, productMetric])

  // ── Revenue by category ──
  const categoryData = useMemo(() => {
    const byCategory = {}
    itemsInRange.forEach((item) => {
      const cat = item.products?.category || item.product_snapshot?.category || 'other'
      byCategory[cat] = (byCategory[cat] || 0) + Number(item.total_price || 0)
    })
    const total = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1
    return Object.entries(byCategory)
      .map(([name, revenue], i) => ({
        name,
        revenue,
        pct: Math.round((revenue / total) * 100),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [itemsInRange])

  if (loading) {
    return <div className="adm-loading"><div className="adm-spinner" /></div>
  }

  const windowLabel = rangeStart
    ? `${formatDay(rangeStart)} – ${formatDay(new Date())}`
    : orders.length
      ? `All time · since ${formatDay(orders[0].created_at)}`
      : 'All time'

  const kpiCards = [
    {
      icon: <FiTrendingUp />, color: '#2d8659',
      label: 'Net Revenue', value: formatCurrency(kpis.revenue),
      delta: { current: kpis.revenue, previous: kpis.prevRevenue },
      sub: 'excl. cancelled / returned / refunded',
    },
    {
      icon: <FiShoppingBag />, color: '#5A3E85',
      label: 'Orders', value: kpis.totalOrders,
      delta: { current: kpis.totalOrders, previous: kpis.prevTotalOrders },
      sub: `${kpis.units} items sold`,
    },
    {
      icon: <FiCreditCard />, color: '#C4896A',
      label: 'Avg Order Value', value: formatCurrency(kpis.aov),
      delta: { current: kpis.aov, previous: kpis.prevAov },
      sub: 'net revenue / counted orders',
    },
    {
      icon: <FiUsers />, color: '#D4AF37',
      label: 'Customers', value: kpis.customers,
      delta: { current: kpis.customers, previous: kpis.prevCustomers },
      sub: `${kpis.returningPct}% returning`,
    },
    {
      icon: <FiPackage />, color: '#4A90D9',
      label: 'Units Sold', value: kpis.units,
      delta: { current: kpis.units, previous: kpis.prevUnits },
      sub: 'across counted orders',
    },
    {
      icon: <FiClock />, color: '#b8860b',
      label: 'Open Orders', value: kpis.openOrders,
      sub: 'pending → shipped, need action',
    },
  ]

  return (
    <div className="adm-analytics">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Analytics</h1>
          <p className="adm-page-sub">{windowLabel}</p>
        </div>
        <div className="adm-analytics__ranges">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={`adm-analytics__range-btn${range === r.key ? ' adm-analytics__range-btn--active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="adm-empty">
          <p className="adm-empty__text">{error}</p>
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* KPIs */}
          <div className="adm-stats">
            {kpiCards.map((card, i) => (
              <div key={i} className="adm-stat-card">
                <div className="adm-stat-card__icon" style={{ color: card.color, background: `${card.color}12` }}>
                  {card.icon}
                </div>
                <span className="adm-stat-card__label">{card.label}</span>
                <span className="adm-stat-card__value">
                  {card.value}
                  {card.delta && <DeltaChip {...card.delta} />}
                </span>
                <span className="adm-stat-card__sub">{card.sub}</span>
              </div>
            ))}
          </div>

          {inRange.length === 0 ? (
            <div className="adm-empty" style={{ marginTop: 22 }}>
              <p className="adm-empty__text">
                No orders in this period — try a wider range
              </p>
            </div>
          ) : (
            <div className="adm-analytics__grid">
              {/* Revenue + orders trend */}
              <div className="adm-analytics__card adm-analytics__card--wide">
                <h2 className="adm-analytics__card-title">Revenue &amp; Orders</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueSeries} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C4896A" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#C4896A" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,64,51,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={6} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="revenue"
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatCompact}
                      width={64}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                      width={32}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(v, key) => (key === 'revenue' ? formatCurrency(v) : v)}
                        />
                      }
                    />
                    <Bar
                      yAxisId="orders"
                      dataKey="orders"
                      name="Orders"
                      fill="#B7A6D1"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                      opacity={0.75}
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#C4896A"
                      strokeWidth={2.5}
                      fill="url(#revGradient)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Orders by status: donut + rate legend */}
              <div className="adm-analytics__card">
                <h2 className="adm-analytics__card-title">Orders by Status</h2>
                <div className="adm-analytics__donut-row">
                  <div className="adm-analytics__donut-wrap">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {statusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<ChartTooltip valueFormatter={(v) => `${v} orders`} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="adm-analytics__donut-center">
                      <span className="adm-analytics__donut-total">{inRange.length}</span>
                      <span className="adm-analytics__donut-caption">orders</span>
                    </div>
                  </div>
                  <div className="adm-analytics__status-legend">
                    {statusData.map((s) => (
                      <div key={s.name} className="adm-analytics__status-item">
                        <span className="adm-analytics__tooltip-dot" style={{ background: s.color }} />
                        <span className="adm-analytics__status-name">{s.name}</span>
                        <span className="adm-analytics__status-count">{s.value}</span>
                        <span className="adm-analytics__status-pct">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disruptions */}
              <div className="adm-analytics__card">
                <h2 className="adm-analytics__card-title">Cancellations, Returns &amp; Refunds</h2>
                {!hasDisruptions ? (
                  <div className="adm-empty"><p className="adm-empty__text">None in this period 🎉</p></div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={hasApproxDates ? 224 : 250}>
                      <LineChart data={disruptionSeries} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,64,51,0.08)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={6} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        {Object.entries(DISRUPTION_COLORS).map(([status, color]) => (
                          <Line
                            key={status}
                            type="monotone"
                            dataKey={status}
                            name={status}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 2.5, strokeWidth: 0, fill: color }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="adm-analytics__inline-legend">
                      {Object.entries(DISRUPTION_COLORS).map(([status, color]) => (
                        <span key={status} className="adm-analytics__inline-legend-item">
                          <span className="adm-analytics__tooltip-dot" style={{ background: color }} />
                          {status}
                        </span>
                      ))}
                    </div>
                    {hasApproxDates && (
                      <p className="adm-analytics__footnote">
                        Some dates are approximate (orders updated before disruption timestamps were added).
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Top products */}
              <div className="adm-analytics__card">
                <div className="adm-analytics__card-header">
                  <h2 className="adm-analytics__card-title">Top Products</h2>
                  <div className="adm-analytics__ranges">
                    <button
                      className={`adm-analytics__range-btn${productMetric === 'revenue' ? ' adm-analytics__range-btn--active' : ''}`}
                      onClick={() => setProductMetric('revenue')}
                    >
                      Revenue
                    </button>
                    <button
                      className={`adm-analytics__range-btn${productMetric === 'quantity' ? ' adm-analytics__range-btn--active' : ''}`}
                      onClick={() => setProductMetric('quantity')}
                    >
                      Qty
                    </button>
                  </div>
                </div>
                {topProducts.length === 0 ? (
                  <div className="adm-empty"><p className="adm-empty__text">No product sales in this period</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(180, topProducts.length * 38)}>
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                    >
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickFormatter={productMetric === 'revenue' ? formatCompact : undefined}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={132}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(n) => (n.length > 16 ? `${n.slice(0, 15)}…` : n)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={(v) =>
                              productMetric === 'revenue' ? formatCurrency(v) : `${v} sold`
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey={productMetric}
                        name={productMetric === 'revenue' ? 'Revenue' : 'Quantity'}
                        fill="#C4896A"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Revenue by category */}
              <div className="adm-analytics__card">
                <h2 className="adm-analytics__card-title">Revenue by Category</h2>
                {categoryData.length === 0 ? (
                  <div className="adm-empty"><p className="adm-empty__text">No sales in this period</p></div>
                ) : (
                  <div className="adm-analytics__cats">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="adm-analytics__cat">
                        <div className="adm-analytics__cat-top">
                          <span className="adm-analytics__cat-name">{cat.name}</span>
                          <span className="adm-analytics__cat-value">
                            {formatCurrency(cat.revenue)}
                            <span className="adm-analytics__cat-pct">{cat.pct}%</span>
                          </span>
                        </div>
                        <div className="adm-analytics__cat-track">
                          <div
                            className="adm-analytics__cat-fill"
                            style={{ width: `${cat.pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics
