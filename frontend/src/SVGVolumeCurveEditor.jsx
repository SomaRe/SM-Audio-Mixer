import React, { useState, useRef, useEffect, useCallback } from "react";
import AudioControls from "./components/AudioControls";
import Playhead from "./components/Playhead";
import InfoText from "./components/InfoText";
import AudioTrack from "./components/AudioTrack";

const SVGVolumeCurveEditor = () => {
  // Constants
  const svgWidth = 1000;
  const svgHeight = 150;
  const pointRadius = 10;
  const percentageTextSize = 20;
  const textPadding = 5;

  // State Management for Video Audio (Track 1)
  const [tracks, setTracks] = useState([
    {
      id: 1,
      type: "video",
      points: [{ id: 0, x: 0, y: 0 }, { id: 1, x: svgWidth, y: 0 }],
      nextId: 2,
      waveformData: [],
      duration: 0,
      gainNode: null,
      sourceNode: null,
      waveformColor: "rgba(255,255,255,0.5)",
      curveColor: "rgba(255,0,0,0.7)",
      audioBuffer: null,
    },
    {
      id: 2,
      type: "additional",
      points: [{ id: 0, x: 0, y: 0 }, { id: 1, x: svgWidth, y: 0 }],
      nextId: 2,
      waveformData: [],
      duration: 0,
      gainNode: null,
      sourceNode: null,
      waveformColor: "rgba(0,255,0,0.5)",
      curveColor: "rgba(0,0,255,0.7)",
      audioBuffer: null,
    },
  ]);

  // Interaction State for Each Track
  const [interaction, setInteraction] = useState({
    draggedPointId: { 1: null, 2: null },
    focusedPointId: { 1: null, 2: null },
    activeCurve: { 1: null, 2: null },
  });

  const [lastTap, setLastTap] = useState({ id: { 1: null, 2: null }, time: { 1: 0, 2: 0 } });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // Total duration based on video

  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoRef = useRef(null);
  const svgRefs = useRef({});

  // Initialize Audio Context and Gain Nodes
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // Initialize Gain Nodes for Each Track
    setTracks((prevTracks) =>
      prevTracks.map((track) => ({
        ...track,
        gainNode: audioContextRef.current.createGain(),
      }))
    );

    // Cleanup
    return () => {
      tracks.forEach((track) => {
        if (track.sourceNode) {
          track.sourceNode.disconnect();
        }
        if (track.gainNode) {
          track.gainNode.disconnect();
        }
      });
      audioContextRef.current.close();
      cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Video and Extract Audio
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);

      // Load video metadata to get duration
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = videoURL;
      tempVideo.onloadedmetadata = () => {
        const videoDuration = tempVideo.duration;
        setDuration(videoDuration);

        // Update track 1 (video audio) duration
        setTracks((prevTracks) =>
          prevTracks.map((track) =>
            track.type === "video" ? { ...track, duration: videoDuration } : track
          )
        );
      };

      // Set video source
      if (videoRef.current) {
        videoRef.current.src = videoURL;
      }

      // Extract audio from video
      const fileReader = new FileReader();
      fileReader.onload = function (e) {
        const arrayBuffer = e.target.result;
        audioContextRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          setTracks((prevTracks) =>
            prevTracks.map((track) =>
              track.type === "video"
                ? {
                    ...track,
                    waveformData: extractWaveformData(buffer, duration),
                  }
                : track
            )
          );

          // Create MediaElementSourceNode for video
          if (videoRef.current) {
            const source = audioContextRef.current.createMediaElementSource(videoRef.current);
            const videoTrack = tracks.find((t) => t.type === "video");
            source.connect(videoTrack.gainNode);
            videoTrack.gainNode.connect(audioContextRef.current.destination);
          }
        });
      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  // Load Additional Audio
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        audioContextRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          const constrainedDuration = Math.min(buffer.duration, duration);

          setTracks((prevTracks) =>
            prevTracks.map((track) =>
              track.type === "additional"
                ? {
                    ...track,
                    waveformData: extractWaveformData(buffer, constrainedDuration),
                    duration: constrainedDuration,
                    audioBuffer: buffer,
                  }
                : track
            )
          );
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };


  // Function to extract waveform data from AudioBuffer
  const extractWaveformData = (audioBuffer, totalDuration) => {
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
    return waveformData;
  };

  // Function to get volume at a given time from volume curve points
  const getVolumeAtTime = (points, x) => {
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
    const y = leftPoint.y + (rightPoint.y - leftPoint.y) * proportion;
    const volume = 1 - y / svgHeight;
    return Math.max(0, Math.min(1, volume));
  };

  // Playback controls
  const playMedia = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.play();

    tracks.forEach((track) => {
      if (track.type === "additional" && track.audioBuffer) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = track.audioBuffer;
        source.connect(track.gainNode);
        track.gainNode.connect(audioContextRef.current.destination);
        source.start(0, currentTime);
        
        setTracks((prevTracks) =>
          prevTracks.map((t) =>
            t.id === track.id ? { ...t, sourceNode: source } : t
          )
        );
      }
    });

    animationFrameRef.current = requestAnimationFrame(updateVolumes);
  }, [tracks, currentTime]);

  const pauseMedia = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    tracks.forEach((track) => {
      if (track.type === "additional" && track.sourceNode) {
        track.sourceNode.stop();
      }
    });

    cancelAnimationFrame(animationFrameRef.current);
  };

  const stopMedia = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    tracks.forEach((track) => {
      if (track.type === "additional" && track.sourceNode) {
        track.sourceNode.stop();
        track.sourceNode.disconnect();
      }
    });

    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.type === "additional" ? { ...track, sourceNode: null } : track
      )
    );

    cancelAnimationFrame(animationFrameRef.current);
    setCurrentTime(0);
  };

  const updateVolumes = () => {
    if (audioContextRef.current && duration > 0) {
      const currentPlaybackTime = videoRef.current ? videoRef.current.currentTime : 0;
      setCurrentTime(currentPlaybackTime);

      const relativeTime = currentPlaybackTime / duration;
      if (relativeTime >= 1) {
        pauseMedia();
        setCurrentTime(0);
        return;
      }
      const x = relativeTime * svgWidth;

      tracks.forEach((track) => {
        const volume = getVolumeAtTime(track.points, x);
        if (track.gainNode) {
          track.gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        }

        if (track.type === "additional" && currentPlaybackTime > track.duration) {
          if (track.gainNode) {
            track.gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(updateVolumes);
    }
  };

  // Function to get SVG coordinates
  const getSVGCoordinates = useCallback((clientX, clientY, trackId) => {
    const svg = svgRefs.current[trackId];
    if (!svg) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const x = Math.max(0, Math.min(svgWidth, svgP.x));
    const y = Math.max(0, Math.min(svgHeight, svgP.y));

    return { x, y };
  }, []);

  // Function to add a point to a specific track
  const addPointToTrack = useCallback((clientX, clientY, trackId) => {
    const { x, y } = getSVGCoordinates(clientX, clientY, trackId);
    if (x === 0 || x === svgWidth) return;

    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          const newPoint = { id: track.nextId, x, y };
          const newPoints = [...track.points, newPoint].sort((a, b) => a.x - b.x);
          return { ...track, points: newPoints, nextId: track.nextId + 1 };
        }
        return track;
      })
    );
  }, [getSVGCoordinates]);

  // Function to remove a point from a specific track
  const removePointFromTrack = (pointId, trackId) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          if (track.points.length > 2 && pointId !== 0 && pointId !== 1) {
            const newPoints = track.points.filter((point) => point.id !== pointId);
            return { ...track, points: newPoints };
          }
        }
        return track;
      })
    );
  };

  // Functions to handle dragging points
  const startDraggingPoint = (pointId, trackId) => {
    setInteraction((prev) => ({
      ...prev,
      draggedPointId: { ...prev.draggedPointId, [trackId]: pointId },
      activeCurve: { ...prev.activeCurve, [trackId]: trackId },
    }));
  };

  const dragPoint = useCallback((clientX, clientY, trackId) => {
    const draggedId = interaction.draggedPointId[trackId];
    if (draggedId === null) return;
  
    const { x, y } = getSVGCoordinates(clientX, clientY, trackId);
  
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          const firstPointId = track.points[0].id;
          const lastPointId = track.points[track.points.length - 1].id;
          const updatedPoints = track.points.map((point) => {
            if (point.id === draggedId) {
              let newX = point.x;
              if (point.id !== firstPointId && point.id !== lastPointId) {
                newX = Math.max(0, Math.min(svgWidth, x));
              }
              let newY = Math.max(0, Math.min(svgHeight, y));
              if (point.id === firstPointId) newX = 0;
              if (point.id === lastPointId) newX = svgWidth;
              return { ...point, x: newX, y: newY };
            }
            return point;
          }).sort((a, b) => a.x - b.x);
          return { ...track, points: updatedPoints };
        }
        return track;
      })
    );
  }, [interaction.draggedPointId, getSVGCoordinates, svgWidth, svgHeight]);

  const stopDraggingPoint = () => {
    setInteraction((prev) => ({
      ...prev,
      draggedPointId: { 1: null, 2: null },
      activeCurve: { 1: null, 2: null },
    }));
  };

  // Handle Tap for Removing Points
  const handleTapOnPoint = (pointId, event, trackId) => {
    event.preventDefault();
    const currentTimeTap = new Date().getTime();
    const tapLength = currentTimeTap - lastTap.time[trackId];
    if (tapLength < 300 && pointId === lastTap.id[trackId]) {
      removePointFromTrack(pointId, trackId);
      setLastTap((prev) => ({
        ...prev,
        id: { ...prev.id, [trackId]: null },
        time: { ...prev.time, [trackId]: 0 },
      }));
    } else {
      setLastTap((prev) => ({
        ...prev,
        id: { ...prev.id, [trackId]: pointId },
        time: { ...prev.time, [trackId]: currentTimeTap },
      }));
    }
  };

  // Generate Bezier Path
  const generateBezierPath = (points) => {
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

  // Get Current Percentage for InfoText
  const getCurrentPercentage = (points) => {
    const activePointId = interaction.draggedPointId[1] || interaction.draggedPointId[2] ||
                           interaction.focusedPointId[1] || interaction.focusedPointId[2];
    if (activePointId !== null) {
      const currentTrack = tracks.find((t) => t.points.some((p) => p.id === activePointId));
      if (currentTrack) {
        const activePoint = currentTrack.points.find((point) => point.id === activePointId);
        if (activePoint) {
          return (100 - ((activePoint.y / svgHeight) * 100).toFixed(0));
        }
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

    if (y < percentageTextSize + textPadding) {
      textY = y + percentageTextSize + textPadding;
    }

    return { x: textX, y: textY, textAnchor };
  };

  const drawWaveform = (waveformData, audioDuration) => {
    if (waveformData.length === 0) return "";
    const centerY = svgHeight / 2;
    const step = svgWidth / waveformData.length;
    let path = "";

    waveformData.forEach((point, index) => {
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
        handleVideoUpload={handleVideoUpload}
        handleAudioUpload={handleAudioUpload}
        playMedia={playMedia}
        pauseMedia={pauseMedia}
        stopMedia={stopMedia}
        videoLoaded={tracks.some((t) => t.type === "video" && t.waveformData.length > 0)}
        audioLoaded={tracks.some((t) => t.type === "additional" && t.waveformData.length > 0)}
      />
      <div className="relative w-full h-full overflow-visible flex flex-col items-center">
        <div style={{ minWidth: svgWidth }}>
          <div className="flex justify-center items-center">
            <video
              ref={videoRef}
              controls={false}
              className="mb-4 h-96 rounded-lg"
              onTimeUpdate={() => {
                setCurrentTime(videoRef.current.currentTime);
              }}
            />
          </div>
          {tracks.map((track) => (
            <svg
              key={track.id}
              ref={(el) => (svgRefs.current[track.id] = el)}
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              overflow={"visible"}
              className="rounded-lg bg-base-100 shadow-inner mb-4"
              onMouseMove={(e) => {
                if (interaction.draggedPointId[track.id] !== null) {
                  dragPoint(e.clientX, e.clientY, track.id);
                }
              }}
              onMouseUp={stopDraggingPoint}
              onMouseLeave={stopDraggingPoint}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                dragPoint(touch.clientX, touch.clientY, track.id);
              }}
              onTouchEnd={stopDraggingPoint}
              onClick={(e) => {
                const { x } = getSVGCoordinates(e.clientX, e.clientY, track.id);
                const newTime = (x / svgWidth) * duration;
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime;
                }
                setCurrentTime(newTime);
              }}
            >
              <defs>
                <linearGradient
                  id={`waveformGradient${track.id}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      track.type === "video"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,255,0,0.2)"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      track.type === "video"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,255,0,0.05)"
                    }
                  />
                </linearGradient>
              </defs>

              <AudioTrack
                svgWidth={svgWidth}
                svgHeight={svgHeight}
                waveformData={track.waveformData}
                audioDuration={track.duration}
                points={track.points}
                setPoints={(newPoints) =>
                  setTracks((prevTracks) =>
                    prevTracks.map((t) =>
                      t.id === track.id ? { ...t, points: newPoints } : t
                    )
                  )
                }
                draggedPointId={interaction.draggedPointId[track.id]}
                focusedPointId={interaction.focusedPointId[track.id]}
                startDragging={(id) => {
                  setInteraction((prev) => ({
                    ...prev,
                    draggedPointId: { ...prev.draggedPointId, [track.id]: id },
                    activeCurve: { ...prev.activeCurve, [track.id]: track.id },
                  }));
                }}
                removePoint={(id) => removePointFromTrack(id, track.id)}
                handleTap={(id, e) => handleTapOnPoint(id, e, track.id)}
                setFocusedPointId={(id) =>
                  setInteraction((prev) => ({
                    ...prev,
                    focusedPointId: { ...prev.focusedPointId, [track.id]: id },
                  }))
                }
                curveIndex={track.id}
                waveformColor={track.waveformColor}
                curveColor={track.curveColor}
                generateBezierPath={generateBezierPath}
                drawWaveform={drawWaveform}
                getTextPosition={getTextPosition}
                pointRadius={pointRadius}
                percentageTextSize={percentageTextSize}
                textPadding={textPadding}
                addPoint={(clientX, clientY) => addPointToTrack(clientX, clientY, track.id)}
              />

              {/* Playhead */}
              <Playhead
                position={getPlayheadPosition()}
                height={svgHeight}
              />
            </svg>
          ))}
        </div>
      </div>
      <InfoText
        currentPercentage1={getCurrentPercentage(tracks.find((t) => t.type === "video").points)}
        currentPercentage2={getCurrentPercentage(tracks.find((t) => t.type === "additional").points)}
        currentTime={currentTime}
        duration={duration}
      />
    </div>
  );
};

export default SVGVolumeCurveEditor;