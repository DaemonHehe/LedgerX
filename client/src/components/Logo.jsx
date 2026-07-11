import React from 'react';

export const Logo = ({ className = "w-8 h-8" }) => (
  <svg 
    className={className} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Sharp Container Background */}
    <rect width="100" height="100" fill="#000000" />
    
    {/* Blueprint Technical Grid (Nothing style) */}
    <circle cx="25" cy="25" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="25" cy="50" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="25" cy="75" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="50" cy="25" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="50" cy="50" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="50" cy="75" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="75" cy="25" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="75" cy="50" r="1" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="75" cy="75" r="1" fill="#FFFFFF" fillOpacity="0.2" />

    {/* Small alignment tick lines */}
    <line x1="10" y1="50" x2="16" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="84" y1="50" x2="90" y2="50" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="50" y1="10" x2="50" y2="16" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="50" y1="84" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />

    {/* Bold Modern L - representing ledger and receipt structure */}
    <path 
      d="M20 20V80H60" 
      stroke="#FFFFFF" 
      strokeWidth="8" 
      strokeLinecap="square" 
      strokeLinejoin="miter" 
    />
    
    {/* Receipt perforation details at top-left L end */}
    <line x1="16" y1="20" x2="24" y2="20" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="16" y1="23" x2="24" y2="23" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.6" />

    {/* Bold Modern X in Accent Red overlapping the L */}
    {/* We drop-shadow the X to separate it from the L */}
    <path 
      d="M45 35L80 70" 
      stroke="#000000" 
      strokeWidth="14" 
      strokeLinecap="square" 
    />
    <path 
      d="M80 35L45 70" 
      stroke="#000000" 
      strokeWidth="14" 
      strokeLinecap="square" 
    />

    <path 
      d="M45 35L80 70" 
      stroke="#EF4444" 
      strokeWidth="8" 
      strokeLinecap="square" 
    />
    <path 
      d="M80 35L45 70" 
      stroke="#EF4444" 
      strokeWidth="8" 
      strokeLinecap="square" 
    />

    {/* Technical calibration mark or serial code in the bottom corner */}
    <rect x="20" y="86" width="3" height="3" fill="#FFFFFF" fillOpacity="0.5" />
    <rect x="25" y="86" width="10" height="3" fill="#FFFFFF" fillOpacity="0.5" />
  </svg>
);
