import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export default function AnimatedCounter({ 
  end, 
  duration = 2000, 
  className = '',
  formatter = (val) => val.toLocaleString()
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [lastEnd, setLastEnd] = useState(end);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reset animation when end value changes significantly
  useEffect(() => {
    if (end !== lastEnd && end > 0) {
      setHasAnimated(false);
      setLastEnd(end);
    }
  }, [end, lastEnd]);

  useEffect(() => {
    // Don't animate if end is 0, undefined, or NaN
    if (!end || isNaN(end) || end === 0) {
      setCount(end || 0);
      return;
    }

    if (hasAnimated) return;

    // Skip animation for users who prefer reduced motion
    if (prefersReducedMotion) {
      setCount(end);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const startValue = 0;
          const endValue = end;
          
          const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
            
            setCount(currentValue);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(endValue);
            }
          };
          
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated, prefersReducedMotion]);

  return (
    <span ref={elementRef} className={className}>
      {formatter(count)}
    </span>
  );
}
