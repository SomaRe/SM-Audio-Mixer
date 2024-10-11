import React from 'react';

const VolumeCurve = ({ pathD, lineThickness, onMouseDown, onTouchStart, strokeColor }) => {
  return (
    <path
      d={pathD}
      fill="none"
      stroke={strokeColor}
      strokeWidth={lineThickness}
      className="transition-all duration-100 ease-in-out cursor-pointer"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
};

export default VolumeCurve;