import { useRef, useState } from 'react'

type Actions = 'longpress' | 'click' | null

export const useLongPress = () => {
  const [action, setAction] = useState<Actions>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef<boolean>(false)

  const startPressTimer = () => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      setAction('longpress')
    }, 500)
  }

  const handleOnPointerDown = () => {
    startPressTimer()
  }

  const handleOnPointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      if (!isLongPress.current) {
        setAction('click')
      }
      setAction(null) // Đặt lại action khi đã xử lý
    }
  }

  const handleOnClick = () => {
    if (isLongPress.current) {
      // e.preventDefault() // Ngăn chặn sự kiện click khi long press
      return
    }
    setAction('click')
  }

  return {
    action,
    handlers: {
      onPointerDown: handleOnPointerDown,
      onPointerUp: handleOnPointerUp,
      onClick: handleOnClick,
    },
  }
}
