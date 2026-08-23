import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ADMIN_EMAIL = 'nanikiibunai@gmail.com'
const PER_PAGE = 1000
const MAX_PAGES = 5 // safety cap: 5000 users

// deno-lint-ignore no-explicit-any
function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Whitelist of user fields returned to the client — never expose the raw
// auth.users object (it contains sensitive internals).
// deno-lint-ignore no-explicit-any
function mapUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone || null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at || null,
    email_confirmed_at: u.email_confirmed_at || null,
    provider: u.app_metadata?.provider || 'email',
    user_metadata: u.user_metadata || {},
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // ── Auth gate ──────────────────────────────────────────────
    // Platform verify_jwt only checks for *a* valid project JWT (the anon
    // key passes it) — this in-function check is the real gate: validate
    // the caller's token against GoTrue, then require the admin email.
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Missing authorization' }, 401)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user: caller }, error: authError } = await admin.auth.getUser(token)
    if (authError || !caller) return json({ error: 'Unauthorized' }, 401)
    if ((caller.email || '').toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: 'Forbidden' }, 403)
    }

    // ── Actions ────────────────────────────────────────────────
    const { action, userId } = await req.json()

    if (action === 'list') {
      const users = []
      for (let page = 1; page <= MAX_PAGES; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
        if (error) throw error
        users.push(...data.users.map(mapUser))
        if (data.users.length < PER_PAGE) break
      }
      return json({ users, total: users.length })
    }

    if (action === 'get') {
      if (!userId || typeof userId !== 'string') {
        return json({ error: 'userId is required' }, 400)
      }
      const { data, error } = await admin.auth.admin.getUserById(userId)
      if (error || !data?.user) return json({ error: 'User not found' }, 404)
      return json({ user: mapUser(data.user) })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('admin-users error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
