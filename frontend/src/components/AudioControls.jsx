import React from "react";

const AudioControls = ({
  handleVideoUpload,
  handleAudioUpload,
  playMedia,
  pauseMedia,
  stopMedia,
  videoLoaded,
  audioLoaded,
}) => {
  return (
    <div className="mb-4">
      {/* Video Upload */}
      <div className="flex justify-center items-center mb-2">
        <span className="mr-2">Video</span>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs mr-2"
        />
      </div>
      {/* Additional Audio Upload */}
      <div className="flex justify-center items-center mb-2">
        <span className="mr-2">Additional Audio</span>
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs mr-2"
        />
      </div>
      {/* Controls */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={playMedia}
          disabled={!videoLoaded}
          className="btn btn-primary ml-2"
        >
          Play
        </button>
        <button
          onClick={pauseMedia}
          disabled={!videoLoaded}
          className="btn btn-secondary ml-2"
        >
          Pause
        </button>
        <button
          onClick={stopMedia}
          disabled={!videoLoaded}
          className="btn btn-error ml-2"
        >
          Stop
        </button>
      </div>
    </div>
  );
};

export default AudioControls;