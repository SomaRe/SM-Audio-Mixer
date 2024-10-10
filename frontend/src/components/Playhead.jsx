import React from 'react';

const Playhead = ({ position, totalHeight }) => {
  return (
    <line
      x1={position}
      y1={0}
      x2={position}
      y2={totalHeight}
      stroke="oklch(var(--s))"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
};

export default Playhead;
