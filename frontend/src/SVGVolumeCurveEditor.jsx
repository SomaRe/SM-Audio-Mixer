import React, { useState, useRef, useEffect } from 'react';

const SVGVolumeCurveEditor = () => {
  const svgWidth = 800;
  const svgHeight = 200;
  const pointRadius = 10;
  const lineThickness = 5;
  const percentageTextSize = 20;
  const textPadding = 5;
  const verticalPadding = pointRadius;
  const totalHeight = svgHeight + verticalPadding * 2;

  const [points, setPoints] = useState([
    { id: 0, x: 0, y: svgHeight },
    { id: 1, x: svgWidth, y: svgHeight },
  ]);
  const [nextId, setNextId] = useState(2);
  const [draggedPointId, setDraggedPointId] = useState(null);
  const [focusedPointId, setFocusedPointId] = useState(null);
  const [lastTap, setLastTap] = useState({ id: null, time: 0 });
  const [currentTime, setCurrentTime] = useState(0); // New state
  const svgRef = useRef(null);

  // Audio-related states and refs
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Initialize Audio Context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    const handleTouchMove = (e) => {
      if (draggedPointId !== null) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      // Cleanup
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      gainNodeRef.current.disconnect();
      audioContextRef.current.close();
      document.removeEventListener('touchmove', handleTouchMove);
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
        let sum = 0;
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
        { id: 0, x: 0, y: svgHeight },
        { id: 1, x: svgWidth, y: svgHeight },
      ]);
      setCurrentTime(0); // Reset currentTime when new audio is loaded
    }
  }, [audioBuffer]);

  const handleSeek = (clientX) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(svgWidth, x));
    const relativeTime = clampedX / svgWidth;
    setCurrentTime(relativeTime * duration);
  };

  /**
   * Handles an audio file being uploaded to the input field.
   *
   * Reads the uploaded file as an array buffer and decodes it using the
   * Web Audio API. When the audio buffer is decoded, it is stored in the
   * component state.
   *
   * @param {Event} event - The input field change event.
   */
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
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
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      
      // Calculate offset to resume playback from currentTime
      source.start(0, currentTime);
      sourceNodeRef.current = source;

      // Start animation loop for synchronization
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    }
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const updateVolume = () => {
    if (audioContextRef.current && gainNodeRef.current && duration > 0) {
      const currentPlaybackTime = audioContextRef.current.currentTime + currentTime;
      
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
      const volume = ((leftPoint.y + (rightPoint.y - leftPoint.y) * proportion) / svgHeight).toFixed(2);

      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
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
    let y = screenYToDataY(svgP.y);
    y = Math.max(0, Math.min(svgHeight, y));

    return { x, y };
  };

  const screenYToDataY = (screenY) => {
    return svgHeight - (screenY - verticalPadding);
  };

  const dataYToScreenY = (dataY) => {
    return verticalPadding + (svgHeight - dataY);
  };

  const addPoint = (clientX, clientY) => {
    const { x, y } = getSVGCoordinates(clientX, clientY);
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
            } else if (point.id === lastPointId) {
              newPoint.x = svgWidth; // Lock x-coordinate for the last point
            } else {
              newPoint.x = x; // Allow x-coordinate change for other points
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
    if (points.length > 2 && id !== points[0].id && id !== points[points.length - 1].id) {
      const newPoints = points.filter((point) => point.id !== id);
      setPoints(newPoints);
    }
  };

  const generateBezierPath = () => {
    if (points.length < 2) return '';

    const path = [];
    path.push(`M ${points[0].x} ${dataYToScreenY(points[0].y)}`);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;

      path.push(
        `C ${midX} ${dataYToScreenY(p0.y)}, ${midX} ${dataYToScreenY(
          p1.y
        )}, ${p1.x} ${dataYToScreenY(p1.y)}`
      );
    }

    return path.join(' ');
  };

  const pathD = generateBezierPath();

  const getCurrentPercentage = () => {
    const activePointId = draggedPointId || focusedPointId;
    if (activePointId !== null) {
      const activePoint = points.find(point => point.id === activePointId);
      if (activePoint) {
        return ((activePoint.y / svgHeight) * 100).toFixed(0);
      }
    }
    return null;
  };

  const getTextPosition = (x, y) => {
    let textX = x;
    let textY = dataYToScreenY(y) - 10;
    let textAnchor = "middle";

    if (x < percentageTextSize * 2) {
      textX = percentageTextSize * 2;
      textAnchor = "start";
    } else if (x > svgWidth - percentageTextSize * 2) {
      textX = svgWidth - percentageTextSize * 2;
      textAnchor = "end";
    }

    if (y > svgHeight - percentageTextSize - textPadding) {
      textY = dataYToScreenY(y) + percentageTextSize + textPadding;
    }

    return { x: textX, y: textY, textAnchor };
  };

  const drawWaveform = () => {
    if (waveform.length === 0) return '';
    const centerY = svgHeight / 2;
    const step = svgWidth / waveform.length;
    let path = '';

    waveform.forEach((point, index) => {
      const x = index * step;
      const yMin = centerY - (point.max * centerY);
      const yMax = centerY - (point.min * centerY);
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
      <div className="mb-4">
        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="file-input file-input-bordered file-input-primary w-full max-w-xs" />
        <button onClick={playAudio} disabled={!audioBuffer} className="btn btn-primary ml-2">
          Play
        </button>
        <button onClick={pauseAudio} disabled={!audioBuffer} className="btn btn-secondary ml-2">
          Pause
        </button>
      </div>
      <div className="relative w-full h-[200px] overflow-visible">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={totalHeight}
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          className="w-full h-full rounded-lg bg-base-100 shadow-inner"
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
            <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          {/* Waveform */}
          <path
            d={drawWaveform()}
            fill="none"
            stroke="url(#waveformGradient)"
            strokeWidth={1}
          />
          {/* Volume Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="oklch(var(--p))"
            strokeWidth={lineThickness}
            className="transition-all duration-100 ease-in-out"
            onMouseDown={(e) => addPoint(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              addPoint(touch.clientX, touch.clientY);
            }}
          />
          {/* Playhead */}
          <line
            x1={getPlayheadPosition()}
            y1={0}
            x2={getPlayheadPosition()}
            y2={totalHeight}
            stroke="oklch(var(--s))"
            strokeWidth={2}
            pointerEvents="none"
          />
          {/* Points */}
          {points.map((point) => {
            const isActive =
              point.id === draggedPointId || point.id === focusedPointId;
            const percentY = (point.y / svgHeight) * 100;
            const screenX = point.x;
            const screenY = dataYToScreenY(point.y);
            const { x: textX, y: textY, textAnchor } = getTextPosition(
              screenX,
              point.y
            );
            return (
              <g key={point.id}>
                <circle
                  cx={screenX}
                  cy={screenY}
                  r={pointRadius}
                  className="fill-secondary hover:fill-secondary-focus transition-colors duration-300"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startDragging(point.id, e.clientX, e.clientY);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    startDragging(point.id, touch.clientX, touch.clientY);
                  }}
                  onDoubleClick={() => removePoint(point.id)}
                  onTouchEnd={(e) => handleTap(point.id, e)}
                  onMouseEnter={() => setFocusedPointId(point.id)}
                  onMouseLeave={() => setFocusedPointId(null)}
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
          })}
        </svg>
      </div>
      <p className="text-sm text-center mt-2 text-base-content">
        Tap on the line to add points. Drag to move. Double-tap to remove.
        {getCurrentPercentage() !== null && ` Current point: ${getCurrentPercentage()}%`}
      </p>
      <p className="text-sm text-center mt-2 text-base-content">
        Current Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </p>
    </div>
  );
};

export default SVGVolumeCurveEditor;