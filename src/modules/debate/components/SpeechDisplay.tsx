import React from 'react';
import type { SpeechInfo, SpeakerInfo } from '@debate-flow/types/interfaces';

interface SpeechDisplayProps {
  speech: SpeechInfo;
  speaker: SpeakerInfo;
}

export const SpeechDisplay: React.FC<SpeechDisplayProps> = ({ speech, speaker }) => {
  return (
    <div className="speech-display">
      <div className="speech-header">
        <span className="speaker-name">{speaker.name}</span>
        <span className="speech-type">{speech.type === 'innerThoughts' ? '内心OS' : '正式发言'}</span>
        <span className="speech-status">{speech.status}</span>
      </div>
      
      <div className="speech-content">
        {speech.status === 'streaming' ? (
          <>
            {speech.content}
            <span className="typing-indicator">...</span>
          </>
        ) : (
          speech.content
        )}
      </div>
    </div>
  );
}; 