"use client";

import { useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MemoryThread({ className = "" }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M0 140 C 120 40, 220 180, 340 90 S 560 20, 680 110 S 780 60, 800 90"
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="2 10"
        strokeLinecap="round"
      >
        {!reducedMotion && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-120"
            dur="18s"
            repeatCount="indefinite"
          />
        )}
      </path>
      {[
        [0, 140],
        [340, 90],
        [560, 20],
        [800, 90],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" fill="var(--accent-warm)" fillOpacity="0.6" />
      ))}
    </svg>
  );
}
