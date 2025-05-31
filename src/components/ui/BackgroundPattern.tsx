import React from 'react';

interface BackgroundPatternProps {
  className?: string;
}

export function BackgroundPattern({ className = '' }: BackgroundPatternProps) {
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
      <svg
        className="absolute inset-0 h-full w-full stroke-purple-200/20 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="gridPattern"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 .5H32M.5 0V32" fill="none" />
          </pattern>
          <pattern
            id="dotPattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#gridPattern)" />
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#dotPattern)" />
        <rect
          width="100%"
          height="100%"
          strokeWidth="0"
          fill="url(#gridPattern)"
          className="translate-x-2 translate-y-2"
        />
      </svg>
    </div>
  );
} 