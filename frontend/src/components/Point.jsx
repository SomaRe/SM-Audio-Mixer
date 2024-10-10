import React from 'react';

const Point = ({
  point,
  isActive,
  percentY,
  screenX,
  screenY,
  textX,
  textY,
  textAnchor,
  handleMouseDown,
  handleTouchStart,
  handleDoubleClick,
  handleTouchEnd,
  handleMouseEnter,
  handleMouseLeave,
  svgHeight,
  percentageTextSize,
  textPadding,
}) => {
  return (
    <g>
      <circle
        cx={screenX}
        cy={screenY}
        r={10} // pointRadius
        className="fill-secondary hover:fill-secondary-focus transition-colors duration-300"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {isActive && (
        <text
          x={textX}
          y={textY}
          fontSize={percentageTextSize}
          textAnchor={textAnchor}
          fill="oklch(var(--nc))"
          className="font-semibold"
        >
          {`${percentY.toFixed(0)}%`}
        </text>
      )}
    </g>
  );
};

export default Point;
