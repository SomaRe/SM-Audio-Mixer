// File: frontend/src/components/InfoText.jsx

import React from 'react';

const InfoText = ({
  currentPercentage1,
  currentPercentage2,
  currentTime,
  duration,
}) => {
  return (
    <>
      <p className="text-sm text-center mt-2 text-base-content">
        {currentPercentage1 !== null && `Video Volume: ${currentPercentage1}% `}
        {currentPercentage2 !== null && `Audio Volume: ${currentPercentage2}%`}
      </p>
      <p className="text-sm text-center mt-2 text-base-content">
        Current Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </p>
    </>
  );
};

export default InfoText;