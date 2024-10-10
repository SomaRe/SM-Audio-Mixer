import React from 'react';

const AudioControls = ({ handleAudioUpload, playAudio, pauseAudio, stopAudio, audioBuffer }) => {
  return (
    <div className="mb-4">
      <input 
        type="file" 
        accept="audio/*" 
        onChange={handleAudioUpload} 
        className="file-input file-input-bordered file-input-primary w-full max-w-xs" 
      />
      <button 
        onClick={playAudio} 
        disabled={!audioBuffer} 
        className="btn btn-primary ml-2"
      >
        Play
      </button>
      <button 
        onClick={pauseAudio} 
        disabled={!audioBuffer} 
        className="btn btn-secondary ml-2"
      >
        Pause
      </button>
      <button 
        onClick={stopAudio} 
        disabled={!audioBuffer} 
        className="btn btn-error ml-2"
      >
        Stop
      </button>
    </div>
  );
};

export default AudioControls;
