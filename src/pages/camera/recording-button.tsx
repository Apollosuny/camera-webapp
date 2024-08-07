import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';

type Props = {
  maxDuration?: number;
  isRecording?: boolean;
  progress?: number;
  onClick: () => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  customClassNames?: string;
};

const RecordingButton: React.FC<Props> = ({
  maxDuration = 15,
  isRecording = false,
  progress = 0,
  customClassNames,
  onClick,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
}) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      const circle = circleRef.current;
      const radius = circle.r.baseVal.value;
      const circumferenceValue = 2 * Math.PI * radius;
      circle.style.strokeDasharray = circumferenceValue.toString();
      circle.style.strokeDashoffset = circumferenceValue.toString();
    }
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      const circle = circleRef.current;
      circle.style.visibility = 'visible';
      const radius = circle.r.baseVal.value;
      const circumferenceValue = 2 * Math.PI * radius;
      const offset =
        circumferenceValue - (progress / maxDuration) * circumferenceValue;
      circle.style.strokeDashoffset = offset.toString();
    }
  }, [progress, isRecording, maxDuration]);

  useEffect(() => {
    if (isRecording) {
      if (containerRef.current) {
        containerRef.current.style.width = '100px';
        containerRef.current.style.height = '100px';
      }
      if (buttonRef.current) {
        buttonRef.current.style.width = '50px';
        buttonRef.current.style.height = '50px';
      }
    } else {
      if (containerRef.current) {
        containerRef.current.style.width = '74px';
        containerRef.current.style.height = '74px';
      }
      if (buttonRef.current) {
        buttonRef.current.style.width = '60px';
        buttonRef.current.style.height = '60px';
      }
      if (circleRef.current) {
        const circle = circleRef.current;
        const radius = circle.r.baseVal.value;
        const circumferenceValue = 2 * Math.PI * radius;
        circle.style.strokeDashoffset = circumferenceValue.toString();
        circle.style.visibility = 'hidden';
      }
    }
  }, [isRecording]);

  return (
    <div
      className={classNames(
        'relative w-[120px] h-[120px] flex items-center justify-center',
        customClassNames
      )}
      style={{ flex: '0.2' }}
    >
      <div
        ref={containerRef}
        className='relative inline-flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white/50'
        style={{
          transition: 'width 0.3s ease, height 0.3s ease',
        }}
      >
        <button
          ref={buttonRef}
          type='button'
          className='relative z-[999] flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full bg-white'
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        />
        <svg
          className='absolute left-0 top-0 h-full w-full -rotate-90 rounded-full'
          width='100'
          height='100'
        >
          <circle
            ref={circleRef}
            cx='50'
            cy='50'
            r='50'
            strokeWidth='10'
            fill='none'
            stroke='red'
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>
    </div>
  );
};

export default RecordingButton;
