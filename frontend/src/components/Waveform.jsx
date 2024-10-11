import React from 'react';

const Waveform = ({ drawWaveform, waveformGradientId, strokeColor }) => {
  return (
    <path
      d={drawWaveform}
      fill="none"
      stroke={strokeColor}
      strokeWidth={1}
    />
  );
};

export default Waveform;