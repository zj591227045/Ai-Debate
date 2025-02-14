import React from 'react';
import type { DebateStatus } from '@debate-flow/types/interfaces';

interface DebateControlsProps {
  status: DebateStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export const DebateControls: React.FC<DebateControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onEnd
}) => {
  return (
    <div className="debate-controls">
      {status === 'preparing' && (
        <button 
          className="control-button start"
          onClick={onStart}
        >
          开始辩论
        </button>
      )}

      {status === 'ongoing' && (
        <button 
          className="control-button pause"
          onClick={onPause}
        >
          暂停辩论
        </button>
      )}

      {status === 'paused' && (
        <button 
          className="control-button resume"
          onClick={onResume}
        >
          继续辩论
        </button>
      )}

      {(status === 'ongoing' || status === 'paused') && (
        <button 
          className="control-button end"
          onClick={onEnd}
        >
          结束辩论
        </button>
      )}
    </div>
  );
}; 