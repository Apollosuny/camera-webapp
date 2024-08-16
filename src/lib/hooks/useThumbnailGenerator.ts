import { RefObject, useState } from 'react'

export const useThumbnailGenerator = (
  canvasRef: RefObject<HTMLCanvasElement>,
  setVideoDuration: (value: number) => void,
  numberOfThumbnails?: number,
) => {
  const [loading, setLoading] = useState<boolean>(false)

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
              setVideoDuration(video.duration)
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
            var canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            if (numberOfThumbnails) {
              canvas
                .getContext('2d')!
                .drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
              canvas.toBlob(blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  resolve(url)
                }
              })
            } else {
              canvas.getContext('2d')!.drawImage(video, 0, 0, 160, 200)
            }

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

  const generateThumbnail = async (videoFile: File) => {
    try {
      setLoading(true)
      const duration: any = await getVideoDuration(videoFile)
      if (!numberOfThumbnails) {
        return await getVideoThumbnail(videoFile, 0)
      } else {
        let fractions: any = []
        for (let i = 0; i <= duration; i += duration / numberOfThumbnails) {
          fractions.push(Math.floor(i))
        }
        const promiseArr = fractions.map((time: number) =>
          getVideoThumbnail(videoFile, time),
        )
        const results = await Promise.all(promiseArr)
        return results
      }
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    generateThumbnail,
  }
}
