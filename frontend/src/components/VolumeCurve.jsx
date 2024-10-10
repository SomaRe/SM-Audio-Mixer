import React from 'react';

const VolumeCurve = ({ pathD, lineThickness, onMouseDown, onTouchStart }) => {
  return (
    <path
      d={pathD}
      fill="none"
      stroke="oklch(var(--p))"
      strokeWidth={lineThickness}
      className="transition-all duration-100 ease-in-out cursor-pointer"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
};

export default VolumeCurve;