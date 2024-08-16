import { RefObject } from 'react'

export const useThumbnailGenerator = (
  canvasRef: RefObject<HTMLCanvasElement>,
  setVideoDuration: (value: number) => void,
) => {
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
            //  window.URL.revokeObjectURL(url);
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
            canvas.getContext('2d')!.drawImage(video, 0, 0, 160, 200)
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
    let thumbnail: any
    return new Promise(async (resolve, reject) => {
      await getVideoDuration(videoFile).then(async (duration: any) => {
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
      })
    })
  }

  return {
    generateThumbnail,
  }
}
