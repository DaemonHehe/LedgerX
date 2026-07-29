import React from 'react';

export const Logo = ({ className = "w-8 h-8", full = false, fill = "currentColor", xColor = "#FF3B30" }) => (
  <svg 
    className={className} 
    viewBox={full ? "0 0 350 100" : "0 0 100 100"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Logomark */}
    <path d="M16,20 L30,20 L30,66 L40,66 L66,20 L82,20 L56,66 L62,66 L62,80 L16,80 Z" fill={fill}/>
    <path d="M42,35 L58,35 L84,80 L68,80 Z" fill={fill}/>
    
    {full && (
      <g transform="translate(100, 0)">
        <text x="0" y="70" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="56" fill={fill}>Ledger</text>
        <text x="195" y="70" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="56" fill={xColor}>X</text>
        <text x="3" y="90" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="11" fill={fill} letterSpacing="0.1em">PRECISION DIGITAL LEDGER WORKSPACE</text>
      </g>
    )}
  </svg>
);
