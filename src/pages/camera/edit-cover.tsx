import classNames from 'classnames'
import { isEmpty } from 'lodash'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import Skeleton from 'react-loading-skeleton'

import { BodyText } from '@/components/typography/body-text'

import ImageSelector from './image-selector'

type Props = {
  isShowing: boolean
  videoFile?: File
  onClose?: () => void
  onSelectThumbnail?: (value: { blob: Blob; url: string }) => void
}

const EditCover: React.FC<Props> = ({
  isShowing = false,
  videoFile,
  onClose,
  onSelectThumbnail,
}) => {
  const [activeDrags, setActiveDrags] = useState<number>(0)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [thumbnail, setThumbnail] = useState<{ blob: Blob; url: string }>()
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onStart = () => {
    setActiveDrags(activeDrags + 1)
  }

  const onStop = (e: DraggableEvent, data: DraggableData) => {
    setActiveDrags(activeDrags - 1)
    if (videoRef.current && thumbnailContainerRef.current) {
      const boundsLeft = 0
      const boundsRight = thumbnailContainerRef.current.clientWidth - 36
      const percentage = (data.x - boundsLeft) / (boundsRight - boundsLeft)
      const newTime = percentage * videoDuration
      videoRef.current.currentTime = newTime
      updateThumbnail(videoRef.current)
    }
  }

  const updateThumbnail = (video: HTMLVideoElement) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (context) {
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight

      canvas.width = videoWidth
      canvas.height = videoHeight

      requestAnimationFrame(() => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(video, 0, 0, videoWidth, videoHeight)
        canvas.toBlob(
          blob => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              setThumbnail({ blob, url })
            }
          },
          'image/jpeg',
          0.5,
        )
      })
    }
  }

  const onSelectLocalThumbnail = (value: File[]) => {
    const file = value[0]
    const url = URL.createObjectURL(file!)
    const blob = new Blob([file!], { type: file?.type })
    setThumbnail({ blob, url })
  }

  useEffect(() => {
    if (videoFile) {
      // getThumbnail(videoFile)
      // generateThumbnails()
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
    }
  }, [videoFile])

  // const getThumbnail = async (videoFile: File) => {
  //   const test = await generateThumbnail(videoFile, 10)
  //   console.log(test)
  //   // setThumbnail(test as { blob: Blob; url: string })
  // }

  const importFileandPreview = (file: File, revoke?: boolean) => {
    return new Promise((resolve, reject) => {
      window.URL = window.URL || window.webkitURL
      let preview = window.URL.createObjectURL(file)
      if (revoke) {
        window.URL.revokeObjectURL(preview)
      }
      setTimeout(() => {
        resolve(preview)
      }, 100)
    })
  }

  const getVideoDuration = (videoFile: File) => {
    return new Promise((resolve, reject) => {
      if (videoFile) {
        if (videoFile.type.match('video')) {
          importFileandPreview(videoFile).then(url => {
            let video = document.createElement('video')
            video.addEventListener('loadeddata', function () {
              resolve(video.duration)
            })
            video.preload = 'metadata'
            video.src = url as string
            // Load video in Safari / IE11
            video.muted = true
            video.playsInline = true
            video.play()
          })
        }
      } else {
        reject(0)
      }
    })
  }

  const getVideoThumbnail = (file: File, videoTimeInSeconds: number) => {
    return new Promise((resolve, reject) => {
      if (file.type.match('video')) {
        importFileandPreview(file).then(urlOfFIle => {
          setVideoUrl(urlOfFIle as string)
          var video = document.createElement('video')
          var timeupdate = function () {
            if (snapImage()) {
              video.removeEventListener('timeupdate', timeupdate)
              video.pause()
            }
          }
          video.addEventListener('loadeddata', function () {
            if (snapImage()) {
              video.removeEventListener('timeupdate', timeupdate)
            }
          })
          var snapImage = function () {
            if (!canvasRef.current) return
            // var canvas = document.createElement('canvas')
            var canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas
              .getContext('2d')!
              .drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(blob => {
              if (blob) {
                resolve({ blob, url: URL.createObjectURL(blob) })
                return true
              }
              return false
            }, 'image/jpeg')
            return true
          }
          video.addEventListener('timeupdate', timeupdate)
          video.preload = 'metadata'
          video.src = urlOfFIle as string
          // Load video in Safari / IE11
          video.muted = true
          video.playsInline = true
          video.currentTime = videoTimeInSeconds
          video.play()
        })
      } else {
        reject('file not valid')
      }
    })
  }

  const generateThumbnail = async (
    videoFile: File,
    numberOfThumbnails: number,
  ) => {
    let thumbnail: any
    let thumbArr: { blob: Blob; url: string }[] = []
    let fractionArr: number[] = []
    return new Promise(async (resolve, reject) => {
      await getVideoDuration(videoFile).then(async (duration: any) => {
        if (numberOfThumbnails > 1) {
          for (let i = 0; i <= duration; i += duration / numberOfThumbnails) {
            fractionArr.push(Math.floor(i))
          }
          // the array of promises
          let promiseArray = fractionArr.map(time => {
            return getVideoThumbnail(videoFile, time)
          })
          // console.log('promiseArray', promiseArray)
          // console.log('duration', duration)
          // console.log('fractions', fractionArr)
          await Promise.all(promiseArray)
            .then(res => {
              // res.forEach(res => {
              //   // console.log('res', res.slice(0,8))
              //   thumbArr.push(res as { blob: Blob; url: string })
              // })
              // // console.log('thumbnail', thumbnail)
              // resolve(thumbArr)
              console.log(res)
            })
            .catch(err => {
              console.error(err)
            })
            .finally(() => {
              resolve(thumbArr)
            })
        } else if (numberOfThumbnails === 1) {
          let promiseArray = getVideoThumbnail(videoFile, 0)
          await promiseArray
            .then(res => {
              thumbnail = res
              resolve(thumbnail)
            })
            .catch(err => {
              console.error(err)
            })
            .finally(() => {
              resolve(thumbnail)
            })
        }
      })
    })
  }

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      video.currentTime = 1

      const handleLoadedData = () => {
        updateThumbnail(video)
      }

      video.addEventListener('loadeddata', handleLoadedData)

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
      }
    }
  }, [videoRef.current])

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current

      video.src = videoUrl
      video.muted = true // Mute the video to avoid autoplay issues
      video.playsInline = true // For mobile devices
      video.crossOrigin = 'anonymous'

      const handleLoadedMetadata = () => {
        if (video.duration === Infinity || isNaN(Number(video.duration))) {
          video.currentTime = 1e101

          const handleTimeUpdate = () => {
            video.currentTime = 0
            video.removeEventListener('timeupdate', handleTimeUpdate)
            setVideoDuration(video.duration)
          }

          video.addEventListener('timeupdate', handleTimeUpdate)
        } else {
          setVideoDuration(video.duration)
        }
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [videoRef.current, canvasRef.current])

  useEffect(() => {
    if (videoDuration > 0) {
      generateThumbnails()
    }
  }, [videoDuration])

  useEffect(() => {
    return () => {
      setThumbnails([])
      setThumbnail(undefined)
      URL.revokeObjectURL(videoUrl)
      setVideoUrl('')
      setVideoDuration(0)
    }
  }, [])

  const generateThumbnails = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      const duration = videoDuration
      const thumbnailsArr: string[] = []

      const captureFrame = (time: number) => {
        return new Promise<void>(resolve => {
          video.currentTime = time
          console.log('Run outside seeked')
          const handleSeeked = () => {
            console.log('Run inside seekd')
            video.removeEventListener('seeked', handleSeeked)

            const width = 34
            const height = 44
            canvas.width = width
            canvas.height = height

            context?.drawImage(video, 0, 0, width, height)

            canvas.toBlob(
              blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  thumbnailsArr.push(url)
                  console.log(url)
                  resolve()
                } else {
                  resolve()
                }
              },
              'image/jpeg',
              0.5,
            )
          }

          video.addEventListener('seeked', handleSeeked)
        })
      }

      let numberOfThumbnails = 9
      if (thumbnailContainerRef.current) {
        numberOfThumbnails = Math.ceil(
          thumbnailContainerRef.current.clientWidth / 34,
        )
      }

      const generateAllThumbnails = async () => {
        for (let i = 0; i < numberOfThumbnails; i++) {
          const time = (duration / numberOfThumbnails) * i
          await captureFrame(time)
        }
        setThumbnails(thumbnailsArr)
      }

      generateAllThumbnails()
    }
  }

  const handleSelectThumbnail = () => {
    // Clean up
    thumbnails.forEach(item => URL.revokeObjectURL(item))
    onSelectThumbnail?.(thumbnail!)
    onClose?.()
  }

  return (
    isShowing && (
      <div className="fixed left-1/2 top-0 z-[100] flex h-full w-full max-w-md -translate-x-1/2 flex-col justify-between bg-gray-100">
        <div className="w-full grow">
          <Header onClose={onClose} onDone={handleSelectThumbnail} />
          <div className="px-5 py-8">
            <div className="flex items-center justify-center">
              {thumbnail ? (
                <Image
                  src={thumbnail.url}
                  className="rounded-xl"
                  alt="Test"
                  width={260}
                  height={380}
                />
              ) : (
                <Skeleton width="260px" height="200px" />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-lg border p-4">
              <BodyText
                type={3}
                customClassName="text-sm font-normal text-center"
              >
                Select a thumbnail for your grid. Choose a frame from your video
                or pick from your photos.
              </BodyText>
              <div ref={thumbnailContainerRef} className="relative my-2 w-full">
                <div className="flex items-center rounded-xl">
                  {thumbnails.map((item, index) => (
                    <div
                      key={index}
                      className={classNames(
                        'w-[34px] h-[46px]',
                        index === 0 && 'rounded-tl-xl rounded-bl-xl',
                        index === thumbnails.length - 1 &&
                          'rounded-tr-xl rounded-br-xl',
                      )}
                      style={{
                        backgroundImage: `url(${item})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ))}
                </div>
                <Draggable
                  axis="x"
                  bounds={
                    thumbnailContainerRef.current
                      ? {
                          top: 0,
                          right: thumbnailContainerRef.current.clientWidth - 36,
                          bottom:
                            thumbnailContainerRef.current.clientHeight - 48,
                          left: 0,
                        }
                      : { top: 0, right: 0, bottom: 0, left: 0 }
                  }
                  onStart={onStart}
                  onStop={onStop}
                >
                  <div
                    className={classNames(
                      'absolute top-0 h-[48px] w-[36px] rounded-md border-[6px] border-red-500 overflow-hidden',
                    )}
                  >
                    {/* eslint-disable jsx-a11y/media-has-caption */}
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      playsInline
                      crossOrigin="anonymous"
                      draggable={false}
                      muted
                      autoPlay={false}
                      preload="metadata"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </Draggable>
                {isEmpty(thumbnails) && (
                  <Skeleton height="48px" style={{ width: '100%' }} />
                )}
              </div>
              <div className="h-[1px] w-full bg-[#E8E7E7]" />
              <ImageSelector
                hasText
                multiple={false}
                onOpenSelectFile={onSelectLocalThumbnail}
              />
            </div>
          </div>
        </div>
      </div>
    )
  )
}

export default EditCover

type HeaderProps = {
  onClose?: () => void
  onDone?: () => void
}

const Header: React.FC<HeaderProps> = ({ onClose, onDone }) => {
  return (
    <div className="relative flex items-center border-b border-grey-200 bg-grey-50 px-5 py-4">
      <div
        className="flex flex-[0.2_1_0%] flex-row items-center gap-x-2"
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={onClose}
      >
        <ChevronLeft size={20} />
        <BodyText type={1}>Close</BodyText>
      </div>
      <div className="flex-[0.6_1_0%] text-center">
        <BodyText type={3}>Edit Cover</BodyText>
      </div>
      <div
        className="flex-[0.2_1_0%] text-end"
        onClick={onDone}
        onKeyDown={onDone}
        role="button"
        tabIndex={-1}
      >
        <BodyText type={3} customClassName="text-[var(--color-mainGreen)]">
          Done
        </BodyText>
      </div>
    </div>
  )
}
