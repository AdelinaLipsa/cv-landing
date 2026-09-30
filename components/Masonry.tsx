'use client';

// React Bits Masonry, adapted for the wall:
// - items render React nodes instead of background images, and call onSelect instead of window.open
// - GSAP animates only x/y/opacity; width and height are set, never tweened (brief: transform and opacity only)
// - column count comes from props (2 on mobile, 3 on desktop)
// - the container gets the tallest column's height, so content after it doesn't overlap
// - each column drifts at its own parallax rate (motion value passed in per column)
// - entrance is a short rise, once, staggered; no blur filter (too heavy for mid-range Android)

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion, useInView, useReducedMotion, type MotionValue } from 'motion/react';

import { useMedia } from '@/lib/useMedia';

import './Masonry.css';

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

export interface MasonryItem {
  id: string;
  height: number;
  node: React.ReactNode;
  label?: string;
}

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
  col: number;
}

interface MasonryProps {
  items: MasonryItem[];
  onSelect?: (id: string) => void;
  parallax?: MotionValue<number>[];
  gap?: number;
  ease?: string;
  duration?: number;
  stagger?: number;
}

const QUERIES = ['(min-width:900px)'];
const COLUMNS = [3];

const Masonry: React.FC<MasonryProps> = ({
  items,
  onSelect,
  parallax = [],
  gap = 12,
  ease = 'power3.out',
  duration = 0.9,
  stagger = 0.05
}) => {
  const columns = useMedia(QUERIES, COLUMNS, 2);
  const [containerRef, { width }] = useMeasure<HTMLDivElement>();

  const { grid, height } = useMemo(() => {
    // Positions down each column only depend on item heights, so the container height is known before measuring width.
    const colHeights = new Array(columns).fill(0);
    const columnWidth = width ? (width - gap * (columns - 1)) / columns : 0;

    const grid = items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = (columnWidth + gap) * col;
      const y = colHeights[col];
      colHeights[col] += child.height + gap * 2;
      return { ...child, x, y, w: columnWidth, h: child.height, col };
    });

    return { grid: width ? grid : [], height: Math.max(0, ...colHeights) - gap * 2 };
  }, [columns, items, width, gap]);

  const hasMounted = useRef(false);
  // The entrance waits until the wall is actually on screen, so it isn't spent while another pane is showing.
  const inView = useInView(containerRef, { once: true, amount: 0.05 });
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (!grid.length || !inView) return;
    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      if (reduce) {
        gsap.set(selector, { opacity: 1, x: item.x, y: item.y });
      } else if (!hasMounted.current) {
        gsap.fromTo(
          selector,
          { opacity: 0, x: item.x, y: item.y + 40 },
          { opacity: 1, x: item.x, y: item.y, duration: 1.2, ease: 'power3.out', delay: index * stagger }
        );
      } else {
        gsap.to(selector, { x: item.x, y: item.y, opacity: 1, duration, ease, overwrite: 'auto' });
      }
    });
    hasMounted.current = true;
  }, [grid, inView, reduce, stagger, duration, ease]);

  return (
    <div ref={containerRef} className="list" style={{ height }}>
      {grid.map(item => (
        <div
          key={item.id}
          data-key={item.id}
          className="item-wrapper"
          style={{ width: item.w, height: item.h, opacity: 0 }}
        >
          <motion.button
            type="button"
            className="item-inner"
            style={{ y: parallax[item.col] }}
            onClick={() => onSelect?.(item.id)}
            aria-label={item.label}
          >
            {item.node}
          </motion.button>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
