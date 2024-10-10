import React from 'react';

const InfoText = ({ currentPercentage, currentTime, duration, currentVolume }) => {
  return (
    <>
      <p className="text-sm text-center mt-2 text-base-content">
        Tap on the line to add points. Drag to move. Double-tap to remove.
        {currentPercentage !== null && ` Current point: ${currentPercentage}%`}
      </p>
      <p className="text-sm text-center mt-2 text-base-content">
        Current Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </p>
      <p className="text-sm text-center mt-2 text-base-content">
        Current Volume: {(currentVolume * 100).toFixed(0)}%
      </p>
    </>
  );
};

export default InfoText;
