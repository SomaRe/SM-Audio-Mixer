import React, { useState, useRef, useEffect, useCallback } from 'react';

const WaveformPlayer = ({
  svgWidth = 1000, // Default SVG width
  svgHeight = 300, // Default SVG height
  waveformColor = '#3b82f6', // Default waveform color (blue)
  playheadColor = '#ef4444', // Default playhead color (red)
  gradient = true, // Toggle gradient fill for the waveform
  gradientColors = ['#3b82f6', '#2563eb'], // Gradient colors for the waveform
  waveLineWidth = 2, // Width of the waveform line
}) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Ref to track the current playing state to avoid closure issues
  const isPlayingRef = useRef(isPlaying);

  // Sync the ref with the state whenever `isPlaying` changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Process the audio buffer to generate waveform data when buffer is set
  useEffect(() => {
    if (audioBuffer) {
      setDuration(audioBuffer.duration);
      const rawData = audioBuffer.getChannelData(0);
      const samples = 1000; // Increased samples for higher resolution
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
      setCurrentTime(0);
    }
  }, [audioBuffer]);

  // Handle audio file upload
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Ensure the AudioContext is created after user interaction to avoid autoplay restrictions
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        try {
          const arrayBuffer = e.target.result;
          const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          setAudioBuffer(decodedBuffer);
        } catch (error) {
          console.error('Error decoding audio data:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to update the playhead position
  const updatePlayhead = useCallback(() => {
    if (isPlayingRef.current) {
      const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
      const newTime = offsetRef.current + elapsedTime;
      if (newTime >= duration) {
        stopAudio();
      } else {
        setCurrentTime(newTime);
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      }
    }
  }, [duration]);

  // Play audio from the current offset
  const playAudio = async () => {
    if (audioBuffer && !isPlayingRef.current) {
      // Ensure the AudioContext is created or resumed after user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume the AudioContext if it's suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      startTimeRef.current = audioContextRef.current.currentTime; // Capture the start time
      source.start(0, offsetRef.current); // Start playback from the offset
      sourceNodeRef.current = source;

      setIsPlaying(true);
      // Start the playhead animation
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);

      // Handle when the audio ends naturally
      source.onended = () => {
        if (isPlayingRef.current) {
          stopAudio();
        }
      };
    }
  };

  // Pause the audio playback
  const pauseAudio = () => {
    if (isPlayingRef.current && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      setIsPlaying(false);
      offsetRef.current = currentTime; // Save the current time as the offset
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Stop the audio playback and reset
  const stopAudio = () => {
    if (isPlayingRef.current && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    offsetRef.current = 0; // Reset the offset
    cancelAnimationFrame(animationFrameRef.current);
  };

  // Handle seeking within the waveform by clicking on the SVG
  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / svgWidth) * duration;
    setCurrentTime(seekTime);
    offsetRef.current = seekTime; // Update the offset to the new seek time
    if (isPlayingRef.current) {
      pauseAudio();
      playAudio(); // Restart the playback from the new seek time
    }
  };

  // Generate the SVG path for the waveform
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

  // Calculate the current position of the playhead
  const getPlayheadPosition = () => {
    if (!duration || isNaN(currentTime)) return 0;
    return (currentTime / duration) * svgWidth;
  };

  // Generate SVG gradient if enabled
  const renderGradient = () => {
    if (!gradient) return null;
    return (
      <defs>
        <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {gradientColors.map((color, index) => (
            <stop
              key={index}
              offset={`${(index / (gradientColors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg text-black">
      <h2 className="text-2xl font-semibold mb-4 text-center">Waveform Player</h2>
      <div className="flex flex-col items-center">
        {/* Audio Upload */}
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="mb-4"
        />

        {/* Playback Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={playAudio}
            disabled={!audioBuffer || isPlaying}
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg shadow ${
              !audioBuffer || isPlaying
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600 transition'
            }`}
          >
            Play
          </button>
          <button
            onClick={pauseAudio}
            disabled={!isPlaying}
            className={`px-6 py-2 bg-yellow-500 text-white rounded-lg shadow ${
              !isPlaying
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-yellow-600 transition'
            }`}
          >
            Pause
          </button>
          <button
            onClick={stopAudio}
            disabled={!audioBuffer}
            className={`px-6 py-2 bg-red-500 text-white rounded-lg shadow ${
              !audioBuffer
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-red-600 transition'
            }`}
          >
            Stop
          </button>
        </div>

        {/* Waveform SVG */}
        <div className="relative w-full" style={{ maxWidth: svgWidth }}>
          <svg
            width={svgWidth}
            height={svgHeight}
            onClick={handleSeek}
            className="border border-gray-300 rounded cursor-pointer"
          >
            {renderGradient()}
            <path
              d={drawWaveform()}
              fill="none"
              stroke={gradient ? 'url(#waveformGradient)' : waveformColor}
              strokeWidth={waveLineWidth}
            />
            <line
              x1={getPlayheadPosition()}
              y1="0"
              x2={getPlayheadPosition()}
              y2={svgHeight}
              stroke={playheadColor}
              strokeWidth="3"
            />
          </svg>
          {/* Playhead Label */}
          <div
            className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-full"
            style={{ left: `${getPlayheadPosition()}px` }}
          >
            <span className="bg-gray-800 text-white text-xs rounded px-1">
              {currentTime.toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Playback Information */}
        <div className="mt-4 text-center">
          <p>
            <strong>Duration:</strong> {duration.toFixed(2)}s
          </p>
          <p>
            <strong>Current Time:</strong> {currentTime.toFixed(2)}s
          </p>
          <p>
            <strong>Status:</strong> {isPlaying ? 'Playing' : 'Paused'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaveformPlayer;