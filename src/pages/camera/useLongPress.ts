import { useRef, useState } from 'react';

type Actions = 'longpress' | 'click' | null;

export const useLongPress = () => {
  const [action, setAction] = useState<Actions>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef<boolean>(false);

  const startPressTimer = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setAction('longpress');
    }, 500);
  };

  const handleOnClick = () => {
    if (isLongPress.current) {
      return;
    }
    setAction('click');
  };

  const handleOnMouseDown = () => {
    startPressTimer();
  };

  const handleOnMouseUp = () => {
    if (timerRef.current) {
      setAction(null);
      clearTimeout(timerRef.current);
    }
  };

  const handleOnTouchStart = () => {
    startPressTimer();
  };

  const handleOnTouchEnd = () => {
    if (timerRef.current) {
      setAction(null);
      clearTimeout(timerRef.current);
    }
  };

  return {
    action,
    handlers: {
      onClick: handleOnClick,
      onMouseDown: handleOnMouseDown,
      onMouseUp: handleOnMouseUp,
      onTouchStart: handleOnTouchStart,
      onTouchEnd: handleOnTouchEnd,
    },
  };
};
