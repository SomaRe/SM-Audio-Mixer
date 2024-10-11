import React from 'react';
import Waveform from "./Waveform";
import VolumeCurve from "./VolumeCurve";
import Point from "./Point";

const AudioTrack = ({
  svgWidth,
  svgHeight,
  waveformData,
  audioDuration,
  points,
  setPoints,
  draggedPointId,
  focusedPointId,
  startDragging,
  removePoint,
  handleTap,
  setFocusedPointId,
  curveIndex,
  waveformColor,
  curveColor,
  generateBezierPath,
  drawWaveform,
  getTextPosition,
  pointRadius,
  percentageTextSize,
  textPadding,
  addPoint
}) => {
  return (
    <g>
      <Waveform
        drawWaveform={drawWaveform(waveformData, audioDuration)}
        waveformGradientId={`waveformGradient${curveIndex}`}
        strokeColor={waveformColor}
      />
      <VolumeCurve
        pathD={generateBezierPath(points)}
        lineThickness={2}
        strokeColor={curveColor}
        onMouseDown={(e) => {
          addPoint(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          addPoint(touch.clientX, touch.clientY);
        }}
      />
      {points.map((point) => {
        const isActive =
          point.id === draggedPointId || point.id === focusedPointId;
        const percentY = (1 - point.y / svgHeight) * 100;
        const screenX = point.x;
        const screenY = point.y;
        const {
          x: textX,
          y: textY,
          textAnchor,
        } = getTextPosition(screenX, screenY);
        return (
          <Point
            key={`${curveIndex}-${point.id}`}
            point={point}
            pointRadius={pointRadius}
            isActive={isActive}
            percentY={percentY}
            screenX={screenX}
            screenY={screenY}
            textX={textX}
            textY={textY}
            textAnchor={textAnchor}
            handleMouseDown={(e) => {
              e.preventDefault();
              startDragging(point.id);
            }}
            handleTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              startDragging(point.id);
            }}
            handleDoubleClick={() => removePoint(point.id)}
            handleTouchEnd={(e) => handleTap(point.id, e)}
            handleMouseEnter={() => {
              setFocusedPointId(point.id);
            }}
            handleMouseLeave={() => setFocusedPointId(null)}
            svgHeight={svgHeight}
            percentageTextSize={percentageTextSize}
            textPadding={textPadding}
            color={curveColor}
          />
        );
      })}
    </g>
  );
};

export default AudioTrack;