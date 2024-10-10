import React from 'react';

const Waveform = ({ drawWaveform, waveformGradientId }) => {
  return (
    <path
      d={drawWaveform}
      fill="none"
      stroke={`url(#${waveformGradientId})`}
      strokeWidth={1}
    />
  );
};

export default Waveform;
