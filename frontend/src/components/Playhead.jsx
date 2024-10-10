import React from 'react';

const Playhead = ({ position, y, height }) => {
  return (
    <line
      x1={position}
      x2={position}
      y2={height}
      stroke="oklch(var(--s))"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
};

export default Playhead;