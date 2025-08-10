'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export default function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  // const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const showTooltip = (e: React.MouseEvent) => {
    if (containerRef.current) {
      // const rect = containerRef.current.getBoundingClientRect();
      // setPosition({
      //   x: rect.left + rect.width / 2,
      //   y: rect.top - 10
      // });
    }
    console.log(e);

    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Hide tooltip immediately on click
    hideTooltip();
    // Stop propagation to prevent parent click handlers
    e.stopPropagation();
  };

  // Hide tooltip when component unmounts or loses focus
  useEffect(() => {
    const handleGlobalClick = () => {
      hideTooltip();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onClick={handleClick}>
      {children}
      {isVisible && (
        <div
          className="absolute z-50 px-3 py-2 text-sm bg-card text-card-foreground rounded-md shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: '50%',
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: '5px',
          }}>
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-border dark:border-t-border" style={{ marginTop: '-1px' }} />
        </div>
      )}
    </div>
  );
}
