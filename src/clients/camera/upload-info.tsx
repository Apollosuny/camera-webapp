import classNames from 'classnames'
import NextImage from 'next/image'
import React, { useContext, useEffect, useRef, useState } from 'react'

import { FileType, POST_STATUS } from '@/lib/hooks/usePostCreate'

import EditCover from './edit-cover'
import { VideoPlayer } from '@/components/video/video-player'
import { useThumbnailGenerator } from '../../lib/hooks/useThumbnailGenerator'

type Props = {
  images: FileType[]
  hasFiles: boolean
  videoFile?: File
  submitting: boolean
  progress: number
  text: string
  targetGroup: string
  canSubmit: boolean
  setThumbnailFile?: (value: File) => void
  onTextChanged: (value: string) => void
  onTargetGroupChanged: (value: POST_STATUS) => void
  onSubmitPost?: () => void
}

const MainUploadSection: React.FC<Props> = ({
  images,
  hasFiles,
  videoFile,
  submitting,
  progress,
  text,
  targetGroup,
  canSubmit,
  setThumbnailFile,
  onTextChanged,
  onTargetGroupChanged,
  onSubmitPost,
}) => {
  const [showEditCover, setShowEditCover] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onCloseEditCover = () => {
    setShowEditCover(false)
  }

  const onUpdatedThumbnail = (value: { blob: Blob; url: string }) => {
    const formData = new FormData()
    formData.append('thumbnail', value.blob, 'thumbnail.jpeg')
    const thumbnail = formData.get('thumbnail') as File
    setThumbnailFile?.(thumbnail)
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const image = new Image()
        image.src = value.url

        image.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height) // Clear the canvas
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(value.url)
        }

        image.onerror = e => {
          console.error('Image load error:', e)
        }
      }
    }
  }

  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [textInfor, setTextInfo] = useState<string | null>(null)
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!videoFile) {
      return
    }

    getThumbnail(videoFile)
  }, [videoFile])

  const { generateThumbnail } = useThumbnailGenerator(
    canvasRef,
    setVideoDuration,
  )

  const getThumbnail = async (videoFile: File) => {
    const test = await generateThumbnail(videoFile)
    setUrl(test as string)
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex-[0.9_0.9_0%]">
        <div className="mt-6">
          <div className="scrollbar-none gap-2 overflow-scroll whitespace-nowrap px-2">
            {images &&
              images.map(i => (
                <div
                  className="mx-2 inline-block aspect-[4/5] w-40 overflow-hidden rounded-md"
                  key={i.url}
                >
                  <NextImage
                    src={i.url}
                    alt="im1"
                    width={160}
                    height={200}
                    className="h-full w-full object-fill"
                  />
                </div>
              ))}
            <div
              className={classNames(
                'mx-2 hidden aspect-[4/5] w-40 overflow-hidden rounded-md border border-dotted relative ',
                {
                  '!inline-block': hasFiles && !!videoFile,
                },
              )}
            >
              <canvas ref={canvasRef} width="160" height="200" />
              {url && (
                <NextImage
                  src={url}
                  alt="Thumbnail"
                  width={160}
                  height={200}
                  style={{ width: '160px', height: '200px' }}
                />
              )}
              <div className="absolute right-2 top-3 flex items-center justify-center rounded-[20px] bg-white px-2 py-[1px] text-xs !font-normal !text-[#121212]">
                {videoDuration}
              </div>
              <div
                className="absolute bottom-3 right-2 flex items-center justify-center rounded-[20px] bg-white px-4 py-2 text-xs !font-normal !text-[#121212]"
                role="button"
                tabIndex={-1}
                onClick={() => setShowEditCover(true)}
                onKeyDown={() => setShowEditCover(true)}
              >
                Edit Cover
              </div>
              <div
                className={classNames(
                  'absolute hidden w-full h-full justify-center items-center top-0',
                  {
                    '!flex': submitting,
                  },
                )}
              >
                <progress max={100} value={progress} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">{textInfor}</div>

        <div className="mt-6 w-full px-4">
          <textarea
            name="caption"
            id=""
            className="w-full rounded-lg border border-grey-200 p-4 focus:outline-babyGreen"
            placeholder="Write a caption"
            rows={4}
            value={text}
            onChange={e => onTextChanged(e.target.value)}
          />
        </div>
        <div className="mt-1 px-4">
          {/* <TargetGroupSelector
            targetGroup={targetGroup}
            onChanged={onTargetGroupChanged}
          /> */}
        </div>
        {/* TODO: Integrate API location */}
        {/* <div className="px-4 mt-2">
          <LocationSelector />
        </div> */}
      </div>
      {/* <div className="flex flex-col gap-2 p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-lg bg-babyGreen p-3 font-bold text-mainBlack disabled:bg-grey-200 disabled:text-white"
          onClick={onSubmitPost}
          disabled={submitting || !canSubmit}
        >
          {submitting ? <DefaultLoading /> : 'Post'}
        </button>
        <button
          type="button"
          className="w-full rounded-lg bg-white p-3 font-bold text-mainBlack"
          onClick={closeUploadPanel}
        >
          Cancel
        </button>
      </div>
      <div> </div> */}
      {showEditCover && (
        <EditCover
          isShowing={showEditCover}
          videoFile={videoFile}
          onClose={onCloseEditCover}
          onSelectThumbnail={onUpdatedThumbnail}
        />
      )}
    </div>
  )
}

export default MainUploadSection
