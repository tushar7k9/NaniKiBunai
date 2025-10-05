import React from 'react'

const ScarfIcon = ({ size = "1em", color = "currentColor" }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="18"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main head outline with scarf over it */}
      <path 
        d="M 256 40 
           C 180 40, 140 80, 120 120
           C 100 160, 90 200, 90 240
           C 90 260, 95 280, 105 295
           L 80 320
           C 70 330, 65 345, 65 360
           L 65 420
           Q 65 470, 95 490
           L 417 490
           Q 447 470, 447 420
           L 447 360
           C 447 345, 442 330, 432 320
           L 407 295
           C 417 280, 422 260, 422 240
           C 422 200, 412 160, 392 120
           C 372 80, 332 40, 256 40 Z"
        fill={color}
        stroke={color}
        strokeWidth="12"
      />

      {/* Inner face area - lighter */}
      <ellipse 
        cx="290" 
        cy="180" 
        rx="80" 
        ry="110" 
        fill="white" 
        opacity="0.3"
        stroke="none"
      />

      {/* Left side face curve */}
      <path 
        d="M 150 140 
           Q 145 180, 145 220
           Q 145 260, 155 295"
        fill="none"
        stroke={color}
        strokeWidth="12"
      />

      {/* Scarf draping over head - large curved outline */}
      <path 
        d="M 140 100
           C 160 55, 200 30, 256 30
           C 312 30, 352 55, 372 100
           C 385 130, 392 165, 392 200
           C 392 235, 385 265, 370 290
           C 355 315, 335 335, 310 345
           C 290 352, 270 355, 256 355
           C 242 355, 222 352, 202 345
           C 177 335, 157 315, 142 290
           C 127 265, 120 235, 120 200
           C 120 165, 127 130, 140 100 Z"
        fill="none"
        stroke={color}
        strokeWidth="22"
      />

      {/* Right side facial curve detail */}
      <path 
        d="M 340 160
           Q 355 200, 360 240
           C 362 270, 358 300, 350 325"
        fill="none"
        stroke={color}
        strokeWidth="14"
      />

      {/* Bottom body/shoulder area */}
      <path 
        d="M 110 360
           L 140 340
           L 180 350
           L 256 330
           L 332 350
           L 372 340
           L 402 360
           L 402 470
           L 110 470
           Z"
        fill={color}
        stroke={color}
        strokeWidth="8"
      />

      {/* Striped pattern on bottom left */}
      <g stroke="white" strokeWidth="6" strokeLinecap="round">
        <line x1="90" y1="420" x2="135" y2="450" />
        <line x1="85" y1="432" x2="135" y2="462" />
        <line x1="82" y1="444" x2="135" y2="474" />
        <line x1="80" y1="456" x2="130" y2="486" />
        <line x1="80" y1="468" x2="120" y2="490" />
      </g>

      {/* Neck/shoulder curve on left */}
      <path 
        d="M 140 320
           Q 130 340, 125 360"
        fill="none"
        stroke={color}
        strokeWidth="16"
      />

      {/* Neck/shoulder curve on right */}
      <path 
        d="M 372 320
           Q 382 340, 387 360"
        fill="none"
        stroke={color}
        strokeWidth="16"
      />
    </svg>
  )
}

export default ScarfIcon
