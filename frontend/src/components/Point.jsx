import React from 'react';

const Point = ({
  point,
  pointRadius,
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
  color,
}) => {
  return (
    <g>
      <circle
        cx={screenX}
        cy={screenY}
        r={pointRadius}
        fill={color}
        className="hover:opacity-75 transition-opacity duration-300 cursor-pointer"
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
          fill={color}
          className="font-semibold"
          pointerEvents={'none'}
        >
          {`${percentY.toFixed(0)}%`}
        </text>
      )}
    </g>
  );
};

export default Point;