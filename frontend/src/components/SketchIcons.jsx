import React from 'react';

// Hand-drawn sketched stroke style matching Forkcast's artisanal linework

export function SketchLeaf({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

export function SketchVegan({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M12 20V10" />
      <path d="M12 10c0-3.5 2-6 6-6 0 4-2.5 6-6 6Z" />
      <path d="M12 13c0-3-2-5-6-5 0 3.5 2.5 5 6 5Z" />
    </svg>
  );
}

export function SketchMeat({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3.5a5.5 5.5 0 0 0-7.78 0L3.5 7.72a4 4 0 0 0 0 5.66l7.12 7.12a4 4 0 0 0 5.66 0l4.22-4.22a5.5 5.5 0 0 0 0-7.78l-5-5Z" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function SketchWheat({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 22 10-10" />
      <path d="M16 8a3 3 0 1 0-3-3" />
      <path d="M12 12a3 3 0 1 0-3-3" />
      <path d="M20 4a3 3 0 1 0-3-3" />
      <path d="m11 5 6 6" />
      <path d="m7 9 6 6" />
      <line x1="3" y1="3" x2="21" y2="21" strokeDasharray="3 3" />
    </svg>
  );
}

export function SketchChili({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3c-1.5 1-2 2-2 3" fill="none" strokeWidth="2" />
      <path d="M16.5 5.5C14 5 10 6 7 9c-4 4-4.5 9-2 11 2.5 2 7.5 1.5 11.5-2.5 3-3 4-7 3.5-9.5-1.2-1.2-2.3-1.8-3.5-2.5Z" />
    </svg>
  );
}

export function SketchLightning({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function SketchDoc({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export function SketchPencil({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function SketchCoffee({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}
