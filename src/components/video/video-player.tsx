import classNames from 'classnames'
import { CirclePause, CirclePlay } from 'lucide-react'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'

// import { formatTimeDuration } from 'utils/datetime-helpers';

type Props = {
  source: string
  style?: CSSProperties
}

export const VideoPlayer: React.FC<Props> = ({ source, style }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  useEffect(() => {
    const video = videoRef.current

    const updateVideoInfo = () => {
      if (video) {
        setCurrentTime(video.currentTime)
        if (video.duration === Infinity || isNaN(Number(video.duration))) {
          video.currentTime = 1e101

          const handleTimeUpdate = () => {
            video.currentTime = 0
            video.removeEventListener('timeupdate', handleTimeUpdate)
            setDuration(video.duration)
          }

          video.addEventListener('timeupdate', handleTimeUpdate)
        } else {
          video.currentTime = 0
          setDuration(video.duration)
        }
      }
    }

    if (video) {
      video.addEventListener('loadedmetadata', updateVideoInfo)
      video.addEventListener('timeupdate', () =>
        setCurrentTime(video.duration - video.currentTime),
      )
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', updateVideoInfo)
        video.removeEventListener('timeupdate', () =>
          setCurrentTime(video.duration - video.currentTime),
        )
      }
    }
  }, [source])

  const handlePlayPause = () => {
    if (!videoRef.current) {
      return
    }
    const video = videoRef.current
    if (!isPlaying) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div
      className="relative"
      tabIndex={-1}
      role="button"
      onClick={handlePlayPause}
      onKeyDown={handlePlayPause}
      style={style}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={source}
        playsInline
        muted
        autoPlay={false}
        preload="auto"
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
      <div
        id="play-button"
        className={classNames(
          'absolute w-[50px] h-[50px] flex items-center justify-center rounded-full bg-[#121212]/[.2]',
          isPlaying && 'hidden',
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {isPlaying ? (
          <CirclePause size={48} stroke="white" strokeWidth={1} />
        ) : (
          <CirclePlay size={48} stroke="white" strokeWidth={1} />
        )}
      </div>
      {duration > 0 && (
        <div className="absolute right-3 top-3 flex items-center justify-center rounded-[10px] bg-white px-3 py-[1px]">
          <span className="text-xs !text-black font-normal">{currentTime}</span>
        </div>
      )}
    </div>
  )
}
