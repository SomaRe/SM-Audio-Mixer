// Needs more work, this will be made into a React Module / NPM Package

import React, { useState, useRef, useEffect } from "react";
import AudioControls from "./components/AudioControls";
import Waveform from "./components/Waveform";
import VolumeCurve from "./components/VolumeCurve";
import Playhead from "./components/Playhead";
import Point from "./components/Point";
import InfoText from "./components/InfoText";

const SVGVolumeCurveEditor = () => {
  // Constants
  const svgWidth = 1000;
  const svgHeight = 150;
  const pointRadius = 10;
  const lineThickness = 5;
  const percentageTextSize = 20;
  const textPadding = 5;

  // State Management
  const [points, setPoints] = useState([
    { id: 0, x: 0, y: 0 }, 
    { id: 1, x: svgWidth, y: 0 }, // Volume 0%
  ]);
  const [nextId, setNextId] = useState(2);
  const [draggedPointId, setDraggedPointId] = useState(null);
  const [focusedPointId, setFocusedPointId] = useState(null);
  const [lastTap, setLastTap] = useState({ id: null, time: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(1);
  const svgRef = useRef(null);

  // Audio-related states and refs
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    const handleTouchMove = (e) => {
      if (draggedPointId !== null) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      // Cleanup
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      gainNodeRef.current.disconnect();
      audioContextRef.current.close();
      document.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [draggedPointId]);

  // Load Audio and Extract Waveform
  useEffect(() => {
    if (audioBuffer) {
      setDuration(audioBuffer.duration);
      // Extract waveform data
      const rawData = audioBuffer.getChannelData(0); // First channel
      const samples = 500;
      const blockSize = Math.floor(rawData.length / samples);
      const waveformData = [];
      for (let i = 0; i < samples; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < blockSize; j++) {
          const sample = rawData[i * blockSize + j];
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
        waveformData.push({ min, max });
      }
      setWaveform(waveformData);
      // Normalize initial points
      setPoints([
        { id: 0, x: 0, y: 0 },
        { id: 1, x: svgWidth, y: 0 },
      ]);
      setCurrentTime(0); // Reset currentTime when new audio is loaded
    }
  }, [audioBuffer]);

  // Handler functions
  const handleSeek = (clientX) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(svgWidth, x));
    const relativeTime = clampedX / svgWidth;
    setCurrentTime(relativeTime * duration);
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        audioContextRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          setAudioBuffer(buffer);
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const playAudio = () => {
    if (audioBuffer) {
      stopAudio();

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);

      playStartTimeRef.current = audioContextRef.current.currentTime - currentTime;
      source.start(0, currentTime);
      sourceNodeRef.current = source;

      setCurrentTime(currentTime);

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    }
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
      cancelAnimationFrame(animationFrameRef.current);
      setCurrentTime(audioContextRef.current.currentTime - playStartTimeRef.current);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    cancelAnimationFrame(animationFrameRef.current);
    setCurrentTime(0);
  };

  const updateVolume = () => {
    if (audioContextRef.current && gainNodeRef.current && duration > 0) {
      const currentPlaybackTime =
        audioContextRef.current.currentTime - playStartTimeRef.current;

      // Update currentTime state
      setCurrentTime(currentPlaybackTime);

      const relativeTime = currentPlaybackTime / duration;
      if (relativeTime >= 1) {
        pauseAudio();
        setCurrentTime(0); // Reset to start
        return;
      }
      const x = relativeTime * svgWidth;

      // Find surrounding points
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);
      let leftPoint = sortedPoints[0];
      let rightPoint = sortedPoints[sortedPoints.length - 1];

      for (let i = 0; i < sortedPoints.length - 1; i++) {
        if (x >= sortedPoints[i].x && x <= sortedPoints[i + 1].x) {
          leftPoint = sortedPoints[i];
          rightPoint = sortedPoints[i + 1];
          break;
        }
      }

      // Linear interpolation for volume
      const proportion = (x - leftPoint.x) / (rightPoint.x - leftPoint.x);
      const volume = (
        1 - ((leftPoint.y + (rightPoint.y - leftPoint.y) * proportion) /
        svgHeight
      )).toFixed(2);
      setCurrentVolume(volume);

      gainNodeRef.current.gain.setValueAtTime(
        volume,
        audioContextRef.current.currentTime
      );
    }

    // Continue the loop
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const getSVGCoordinates = (clientX, clientY) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const x = Math.max(0, Math.min(svgWidth, svgP.x));
    let y = Math.max(0, Math.min(svgHeight, svgP.y));

    return { x, y };
  };

  const addPoint = (clientX, clientY) => {
    const { x, y } = getSVGCoordinates(clientX, clientY);
    // Prevent adding points at the extreme edges
    if (x === 0 || x === svgWidth) return;

    const newPoint = { id: nextId, x, y };
    const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
    setPoints(newPoints);
    setNextId(nextId + 1);
  };

  const startDragging = (id, clientX, clientY) => {
    setDraggedPointId(id);
  };

  const drag = (clientX, clientY) => {
    if (draggedPointId !== null) {
      const { x, y } = getSVGCoordinates(clientX, clientY);
      const firstPointId = points[0].id;
      const lastPointId = points[points.length - 1].id;

      const newPoints = points
        .map((point) => {
          if (point.id === draggedPointId) {
            let newPoint = { ...point, y };
            if (point.id === firstPointId) {
              newPoint.x = 0; // Lock x-coordinate for the first point
              newPoint.y = y; // Allow y-coordinate change
            } else if (point.id === lastPointId) {
              newPoint.x = svgWidth; // Lock x-coordinate for the last point
              newPoint.y = y; // Allow y-coordinate change
            } else {
              newPoint.x = x; // Allow x-coordinate change for other points
              newPoint.y = y;
            }
            return newPoint;
          } else {
            return point;
          }
        })
        .sort((a, b) => a.x - b.x);
      setPoints(newPoints);
    }
  };

  const endDragging = () => {
    setDraggedPointId(null);
  };

  const handleTap = (id, event) => {
    event.preventDefault();
    const currentTimeTap = new Date().getTime();
    const tapLength = currentTimeTap - lastTap.time;
    if (tapLength < 300 && id === lastTap.id) {
      removePoint(id);
      setLastTap({ id: null, time: 0 });
    } else {
      setLastTap({ id, time: currentTimeTap });
    }
  };

  const removePoint = (id) => {
    if (
      points.length > 2 &&
      id !== points[0].id &&
      id !== points[points.length - 1].id
    ) {
      const newPoints = points.filter((point) => point.id !== id);
      setPoints(newPoints);
    }
  };

  const generateBezierPath = () => {
    if (points.length < 2) return "";

    const path = [];
    path.push(`M ${points[0].x} ${points[0].y}`);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;

      path.push(
        `C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
      );
    }

    return path.join(" ");
  };

  const pathD = generateBezierPath();

  const getCurrentPercentage = () => {
    const activePointId = draggedPointId || focusedPointId;
    if (activePointId !== null) {
      const activePoint = points.find((point) => point.id === activePointId);
      if (activePoint) {
        return (100 - ((activePoint.y / svgHeight) * 100).toFixed(0));
      }
    }
    return null;
  };

  const getTextPosition = (x, y) => {
    let textX = x;
    let textY = y - 10; // Adjust vertically by 10 pixels
    let textAnchor = "middle";

    if (x < percentageTextSize * 2) {
      textX = percentageTextSize * 2;
      textAnchor = "start";
    } else if (x > svgWidth - percentageTextSize * 2) {
      textX = svgWidth - percentageTextSize * 2;
      textAnchor = "end";
    }

    if (y < percentageTextSize + textPadding) { // Adjust condition based on new Y
      textY = y + percentageTextSize + textPadding;
    }

    return { x: textX, y: textY, textAnchor };
  };

  const drawWaveform = () => {
    if (waveform.length === 0) return "";
    const centerY = svgHeight / 2;
    const step = svgWidth / waveform.length;
    let path = "";

    waveform.forEach((point, index) => {
      const x = index * step;
      const yMin = centerY - point.max * centerY;
      const yMax = centerY - point.min * centerY;
      path += `M ${x} ${yMin} L ${x} ${yMax} `;
    });

    return path.trim();
  };

  const getPlayheadPosition = () => {
    if (duration === 0) return 0;
    const relativeTime = currentTime / duration;
    return Math.min(svgWidth, Math.max(0, relativeTime * svgWidth));
  };

  return (
    <div className="w-full max-w-full mx-auto p-4 overflow-visible bg-base-300 rounded-lg shadow-lg">
      <AudioControls
        handleAudioUpload={handleAudioUpload}
        playAudio={playAudio}
        pauseAudio={pauseAudio}
        stopAudio={stopAudio}
        audioBuffer={audioBuffer}
      />
      <div className="relative w-full h-full overflow-visible flex justify-center">
        <div style={{ minWidth: svgWidth }}>
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            overflow={"visible"}
            className="rounded-lg bg-base-100 shadow-inner"
            onMouseMove={(e) => drag(e.clientX, e.clientY)}
            onMouseUp={endDragging}
            onMouseLeave={endDragging}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              drag(touch.clientX, touch.clientY);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              endDragging();
            }}
            onClick={(e) => handleSeek(e.clientX)}
          >
            <defs>
              <linearGradient
                id="waveformGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>
            {/* Waveform */}
            <Waveform
              drawWaveform={drawWaveform()}
              waveformGradientId="waveformGradient"
            />
            {/* Volume Curve */}
            <VolumeCurve
              pathD={pathD}
              lineThickness={lineThickness}
              addPoint={addPoint}
              onMouseDown={(e) => addPoint(e.clientX, e.clientY)}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                addPoint(touch.clientX, touch.clientY);
              }}
            />
            {/* Playhead */}
            <Playhead
              position={getPlayheadPosition()}
              height={svgHeight}
            />
            {/* Points */}
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
                  key={point.id}
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
                    startDragging(point.id, e.clientX, e.clientY);
                  }}
                  handleTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    startDragging(point.id, touch.clientX, touch.clientY);
                  }}
                  handleDoubleClick={() => removePoint(point.id)}
                  handleTouchEnd={(e) => handleTap(point.id, e)}
                  handleMouseEnter={() => setFocusedPointId(point.id)}
                  handleMouseLeave={() => setFocusedPointId(null)}
                  svgHeight={svgHeight}
                  percentageTextSize={percentageTextSize}
                  textPadding={textPadding}
                />
              );
            })}
          </svg>
        </div>
      </div>
      <InfoText
        currentPercentage={getCurrentPercentage()}
        currentTime={currentTime}
        duration={duration}
        currentVolume={currentVolume}
      />
    </div>
  );
};

export default SVGVolumeCurveEditor;
