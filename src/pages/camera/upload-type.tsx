import classNames from 'classnames'
import { first } from 'lodash'
import {
  ArrowDownToLine,
  Check,
  Delete,
  ImageIcon,
  Play,
  RefreshCcw,
  Sticker,
} from 'lucide-react'
import Image from 'next/image'
import React, {
  ChangeEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { Camera } from '@/components/video/camera'
import { VideoPlayer } from '@/components/video/video-player'
import {
  imageLimitSize,
  maxDuration,
  maximumUploadedImages,
  mimeType,
  videoLimitSize,
} from '@/lib/constants/post'
import { useLongPress } from '@/lib/hooks/useLongPress'
import { CameraType } from '@/types/camera.type'

import RecordingButton from './recording-button'

type Props = {
  onImagesChanged: (value: File[]) => void
  onVideoChanged: (value: File) => void
}

export type UploadTypeRef = {
  isPreviewing?: boolean
  onCloseCamrera: () => void
  onResetState: () => void
}

const UploadType = forwardRef<UploadTypeRef, Props>(
  ({ onImagesChanged, onVideoChanged }, ref) => {
    const [isPreviewing, setIsPreviewing] = useState<boolean>(false)
    const [videoLink, setVideoLink] = useState<string>()
    const [captureImage, setCaptureImage] = useState<{
      blob: Blob
      url: string
    } | null>(null)
    const [isRecording, setIsRecording] = useState<boolean>(false)
    const [progress, setProgress] = useState<number>(0)
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
    const [videoChunks, setVideoChunks] = useState<Blob[]>([])
    const [videoBlob, setVideoBlob] = useState<Blob>()
    const [numberOfCameras, setNumberOfCameras] = useState<number>(0)

    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const cameraRef = useRef<CameraType>(null)

    const { action, handlers } = useLongPress()

    useImperativeHandle(ref, () => ({
      isPreviewing: isPreviewing,
      onCloseCamrera: () => {},
      onResetState: () => resetState(),
    }))

    const openMediaSelector = useCallback((type: 'images' | 'video') => {
      if (type === 'images') {
        imageInputRef.current?.click()
      } else {
        videoInputRef.current?.click()
      }
    }, [])

    const handleChangeCameraType = () => {
      if (cameraRef.current) {
        cameraRef.current.switchCamera()
      }
    }

    const handleImagesChanged = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files)
        if (files.length > maximumUploadedImages) {
          return
        }
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (!file?.type.startsWith('image')) {
            return
          }
          if (file.size > imageLimitSize) {
            return
          }
        }
        onImagesChanged(Array.from(e.target.files))
      }
    }

    const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
      const file = first(e.target.files)

      if (file) {
        if (!file.type.startsWith('video')) {
          return
        }
        if (file.size > videoLimitSize) {
          return
        }
        onVideoChanged(file)
      }
    }

    const startRecording = async () => {
      if (cameraRef.current) {
        const recorder = new MediaRecorder(cameraRef.current.stream!, {
          mimeType: mimeType,
        })
        mediaRecorderRef.current = recorder

        mediaRecorderRef.current.start()

        setIsRecording(true)
        setProgress(0)

        const id = setInterval(() => {
          setProgress(prev => {
            if (prev >= maxDuration) {
              clearInterval(id)
              setIsRecording(false)
              return maxDuration
            }
            return prev + 1
          })
        }, 1000)
        setIntervalId(id)

        const chunks: Blob[] = []

        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
          if (typeof event.data === 'undefined') {
            return
          }
          if (event.data.size === 0) {
            return
          }
          chunks.push(event.data)
        }

        setVideoChunks(chunks)
      }
    }

    const stopRecording = () => {
      if (!mediaRecorderRef.current) {
        return
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(videoChunks, { type: mimeType })
        const url = URL.createObjectURL(blob)

        setVideoLink(url)
        setVideoBlob(blob)
        setIsPreviewing(true)
        setVideoChunks([])
      }
      setIsRecording(false)
      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
    }

    const onCaptureImage = async () => {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto()
        setCaptureImage(photo)
        setIsPreviewing(true)
      }
    }

    const onSelectCaptureImage = async () => {
      const formData = new FormData()
      if (captureImage) {
        formData.append(
          'captureImage',
          captureImage.blob,
          `image_${Date.now()}.jpeg`,
        )
        const image = formData.get('captureImage') as File
        onImagesChanged([image])
      }
      if (videoLink && videoBlob) {
        formData.append('video', videoBlob, 'video.mp4')
        const video = formData.get('video') as File
        onVideoChanged(video)
      }
    }

    const resetState = () => {
      if (videoLink) {
        URL.revokeObjectURL(videoLink)
      }
      if (captureImage?.url) {
        URL.revokeObjectURL(captureImage.url)
      }
      setIsPreviewing(false)
      setCaptureImage(null)
      setVideoBlob(undefined)
      setVideoChunks([])
    }

    useEffect(() => {
      if (action === 'longpress') {
        startRecording()
      } else if (action === 'click') {
        onCaptureImage()
      } else {
        stopRecording()
      }
    }, [action])

    useEffect(() => {
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    }, [intervalId])

    const buildCaptureActions = (
      <div className="flex items-center justify-center">
        <div
          className="flex items-center justify-center gap-4"
          style={{ flex: '0.4' }}
        >
          <button
            type="button"
            className={classNames(
              'flex cursor-pointer flex-col items-center justify-center',
            )}
            disabled={numberOfCameras <= 1}
            onClick={handleChangeCameraType}
            onKeyDown={handleChangeCameraType}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
              <RefreshCcw size={24} stroke="white" />
            </div>
            <span className="mt-1 text-xs text-white">Flip</span>
          </button>
          <div className="flex cursor-pointer flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
              <Sticker size={24} stroke="white" />
            </div>
            <span className="mt-1 text-xs text-white">Challenges</span>
          </div>
        </div>

        <RecordingButton
          isRecording={isRecording}
          maxDuration={maxDuration}
          progress={progress}
          {...handlers}
        />

        <div
          className="flex items-center justify-center gap-4"
          style={{ flex: '0.4' }}
        >
          <div
            className="flex cursor-pointer flex-col items-center justify-center"
            tabIndex={-1}
            role="button"
            onClick={() => openMediaSelector('images')}
            onKeyDown={() => openMediaSelector('images')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
              <ImageIcon size={24} stroke="white" />
            </div>
            <span className="mt-1 text-xs text-white">Add Photo</span>
          </div>
          <div
            className="flex cursor-pointer flex-col items-center justify-center"
            tabIndex={-1}
            role="button"
            onClick={() => openMediaSelector('video')}
            onKeyDown={() => openMediaSelector('video')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white">
                <Play size={10} stroke="white" />
              </div>
            </div>
            <span className="mt-1 text-xs text-white">Add Video</span>
          </div>
        </div>
      </div>
    )

    const buildAfterCaptureActions = (
      <div className="flex items-center justify-center gap-8">
        <div
          className="flex cursor-pointer flex-col items-center justify-center"
          style={{ flex: '0.4' }}
          role="button"
          tabIndex={-1}
          onClick={resetState}
          onKeyDown={resetState}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
            <Delete size={24} stroke="white" />
          </div>
          <span className="mt-1 text-xs text-white">Back</span>
        </div>
        <div
          style={{ flex: '0.2' }}
          className="flex items-center justify-center"
        >
          <div
            className="photo-button flex !h-[74px] !w-[74px] items-center justify-center rounded-full bg-white"
            tabIndex={-1}
            role="button"
            onClick={onSelectCaptureImage}
            onKeyDown={onSelectCaptureImage}
          >
            <Check size={30} />
          </div>
        </div>
        <div
          className="flex cursor-pointer flex-col items-center justify-center"
          style={{ flex: '0.4' }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]">
            <ArrowDownToLine size={24} stroke="white" />
          </div>
          <span className="mt-1 text-xs text-white">Download</span>
        </div>
      </div>
    )

    return (
      <div className="h-full bg-[#DFDFDF]">
        <input
          type="file"
          name="myImage"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={handleImagesChanged}
          multiple
        />
        <input
          type="file"
          name="video"
          accept="video/*"
          className="hidden"
          ref={videoInputRef}
          onChange={handleVideoSelect}
        />
        <div className="relative flex h-full flex-col items-center justify-center">
          {isPreviewing ? (
            <>
              {captureImage ? (
                <div className="absolute left-0 top-0 h-full w-full">
                  <Image
                    src={captureImage.url}
                    alt="Capture Photo"
                    width={0}
                    height={0}
                    sizes="100%"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="hidden" />
                  <div className="absolute left-0 top-0 h-full w-full">
                    <VideoPlayer
                      source={videoLink!}
                      // showDuration={false}
                      // customVideoClassnames="!h-full !object-cover"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </>
              )}
              <div
                className="absolute flex w-full -translate-y-5 flex-col items-center justify-end"
                style={{ bottom: '10%' }}
              >
                {buildAfterCaptureActions}
              </div>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <Camera
                ref={cameraRef}
                errorMessages={{}}
                numberOfCamerasCallback={(i: number) => setNumberOfCameras(i)}
              />
              <div
                className="absolute flex w-full -translate-y-5 flex-col items-center justify-end"
                style={{ bottom: '6%' }}
              >
                {buildCaptureActions}
              </div>
            </>
          )}
        </div>
      </div>
    )
  },
)

UploadType.displayName = 'UploadType'

export default UploadType
