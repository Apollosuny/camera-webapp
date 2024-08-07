import { first } from 'lodash';
import {
  ArrowDownToLine,
  Check,
  Delete,
  ImageIcon,
  Play,
  RefreshCcw,
  Sticker,
} from 'lucide-react';
import Image from 'next/image';
import React, {
  ChangeEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { VideoPlayer } from '@/components/video/video-player';
import { BodyText } from '@/components/typography/body-text';
import {
  CAMERA_TYPE,
  imageLimitSize,
  maxDuration,
  maximumUploadedImages,
  mimeType,
  videoLimitSize,
} from '@/lib/constants/post';
import { Camera } from '@/components/video/camera';
import { CameraType } from '@/components/video/types';

import RecordingButton from './recording-button';
import { useLongPress } from '@/lib/hooks/useLongPress';

type Props = {
  onImagesChanged: (value: File[]) => void;
  onVideoChanged: (value: File) => void;
};

export type UploadTypeRef = {
  isPreviewing?: boolean;
  onCloseCamrera: () => void;
  onResetState: () => void;
};

const UploadType = forwardRef<UploadTypeRef, Props>(
  ({ onImagesChanged, onVideoChanged }, ref) => {
    const cameraRef = useRef<CameraType>(null);
    const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
    const [cameraMode, setCameraMode] = useState<CAMERA_TYPE>(
      CAMERA_TYPE.FRONT
    );
    const [videoLink, setVideoLink] = useState<string>();
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [captureImage, setCaptureImage] = useState<{
      blob: Blob;
      url: string;
    } | null>(null);
    const [isErrorWebcam, setIsErrorWebcam] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
    const [videoBlob, setVideoBlob] = useState<Blob>();

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const { action, handlers } = useLongPress();

    useImperativeHandle(ref, () => ({
      isPreviewing: isPreviewing,
      onCloseCamrera: () => onCloseWebcam(),
      onResetState: () => handleBackToWebcam(),
    }));

    const openMediaSelector = useCallback((type: 'images' | 'video') => {
      if (type === 'images') {
        imageInputRef.current?.click();
      } else {
        videoInputRef.current?.click();
      }
    }, []);

    const handleChangeCameraType = useCallback(() => {
      setCameraMode((prev) =>
        prev === CAMERA_TYPE.FRONT ? CAMERA_TYPE.REAR : CAMERA_TYPE.FRONT
      );
    }, []);

    const handleImagesChanged = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        if (files.length > maximumUploadedImages) {
          return;
        }
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file?.type.startsWith('image')) {
            return;
          }
          if (file.size > imageLimitSize) {
            return;
          }
        }
        onImagesChanged(Array.from(e.target.files));
      }
    };

    const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
      const file = first(e.target.files);

      if (file) {
        if (!file.type.startsWith('video')) {
          return;
        }
        if (file.size > videoLimitSize) {
          return;
        }
        onVideoChanged(file);
      }
    };

    const onOpenWebcam = useCallback(async () => {
      try {
        const constraints = {
          video: {
            facingMode: cameraMode,
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          const video = videoRef.current;
          if (cameraMode === CAMERA_TYPE.FRONT) {
            video.style.transform = 'scaleX(-1)';
          } else {
            video.style.transform = 'none';
          }
          video.srcObject = stream;
          setIsErrorWebcam(false);
        }
        setMediaStream(stream);
      } catch (error) {
        setIsErrorWebcam(true);
      }
    }, [cameraMode]);

    const onCloseWebcam = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
        setMediaStream(null);
      }
    };

    const [update, setUpdate] = useState<boolean>(false);
    const [text, setText] = useState<any>();

    const startRecording = async () => {
      console.log('Run here');
      if (cameraRef.current) {
        setText('Has cameraRef');
        const recorder = new MediaRecorder(
          cameraRef.current.stream as MediaStream,
          {
            mimeType: mimeType,
          }
        );
        setText('Has recorder');
        mediaRecorderRef.current = recorder;

        setUpdate(true);

        mediaRecorderRef.current.start();

        setIsRecording(true);
        setProgress(0);

        const id = setInterval(() => {
          setProgress((prev) => {
            if (prev >= maxDuration) {
              clearInterval(id);
              setIsRecording(false);
              return maxDuration;
            }
            return prev + 1;
          });
        }, 1000);
        setIntervalId(id);

        const chunks: Blob[] = [];

        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
          if (typeof event.data === 'undefined') {
            return;
          }
          if (event.data.size === 0) {
            return;
          }
          chunks.push(event.data);
        };

        setVideoChunks(chunks);
      }
    };

    const stopRecording = () => {
      if (!mediaRecorderRef.current) {
        return;
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(videoChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        setVideoLink(url);
        setVideoBlob(blob);
        setIsPreviewing(true);
        setVideoChunks([]);
      };
      setIsRecording(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }

      onCloseWebcam();
    };

    const onCaptureImage = async () => {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto();
        console.log(photo);
        setCaptureImage(photo);
        onCloseWebcam();
        setIsPreviewing(true);
      }
    };

    const onSelectCaptureImage = async () => {
      const formData = new FormData();
      if (captureImage) {
        formData.append(
          'captureImage',
          captureImage.blob,
          `image_${Date.now()}.jpeg`
        );
        const image = formData.get('captureImage') as File;
        onImagesChanged([image]);
      }
      if (videoLink && videoBlob) {
        formData.append('video', videoBlob, 'video.mp4');
        const video = formData.get('video') as File;
        onVideoChanged(video);
      }
    };

    const resetState = () => {
      if (videoLink) {
        URL.revokeObjectURL(videoLink);
      }
      if (captureImage?.url) {
        URL.revokeObjectURL(captureImage.url);
      }
      setIsPreviewing(false);
      setCaptureImage(null);
    };

    const handleBackToWebcam = () => {
      resetState();
      onOpenWebcam();
    };

    useEffect(() => {
      if (action === 'longpress') {
        startRecording();
      } else if (action === 'click') {
        onCaptureImage();
      } else {
        stopRecording();
        setUpdate(false);
        setText(null);
      }
    }, [action]);

    useEffect(() => {
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [intervalId]);

    useEffect(() => {
      onOpenWebcam();

      return () => {
        onCloseWebcam();
        resetState();
      };
    }, [cameraMode]);

    useEffect(() => {
      return () => {
        onCloseWebcam();
      };
    }, []);

    const buildCaptureActions = (
      <div className='flex items-center justify-center gap-8'>
        <RecordingButton
          isRecording={isRecording}
          maxDuration={maxDuration}
          progress={progress}
          {...handlers}
        />

        <div
          className='flex items-center justify-center gap-4'
          style={{ flex: '0.4' }}
        >
          <div
            className='flex cursor-pointer flex-col items-center justify-center'
            tabIndex={-1}
            role='button'
            onClick={() => openMediaSelector('images')}
            onKeyDown={() => openMediaSelector('images')}
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]'>
              <ImageIcon size={24} stroke='white' />
            </div>
            <span className='mt-1 text-xs text-white'>Add Photo</span>
          </div>
          <div
            className='flex cursor-pointer flex-col items-center justify-center'
            tabIndex={-1}
            role='button'
            onClick={() => openMediaSelector('video')}
            onKeyDown={() => openMediaSelector('video')}
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]'>
              <div className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-white'>
                <Play size={10} stroke='white' />
              </div>
            </div>
            <span className='mt-1 text-xs text-white'>Add Video</span>
          </div>
        </div>
      </div>
    );

    const buildAfterCaptureActions = (
      <div className='flex items-center justify-center gap-8'>
        <div
          className='flex cursor-pointer flex-col items-center justify-center'
          style={{ flex: '0.4' }}
          role='button'
          tabIndex={-1}
          onClick={handleBackToWebcam}
          onKeyDown={handleBackToWebcam}
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]'>
            <Delete size={24} stroke='white' />
          </div>
          <span className='mt-1 text-xs text-white'>Back</span>
        </div>
        <div
          style={{ flex: '0.2' }}
          className='flex items-center justify-center'
        >
          <div
            className='photo-button flex !h-[74px] !w-[74px] items-center justify-center rounded-full bg-white'
            tabIndex={-1}
            role='button'
            onClick={onSelectCaptureImage}
            onKeyDown={onSelectCaptureImage}
          >
            <Check size={30} />
          </div>
        </div>
        <div
          className='flex cursor-pointer flex-col items-center justify-center'
          style={{ flex: '0.4' }}
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#53565466]/[.4]'>
            <ArrowDownToLine size={24} stroke='white' />
          </div>
          <span className='mt-1 text-xs text-white'>Download</span>
        </div>
      </div>
    );

    return (
      <div className='h-full bg-[#DFDFDF]'>
        {!isErrorWebcam ? (
          <>
            <input
              type='file'
              name='myImage'
              accept='image/*'
              className='hidden'
              ref={imageInputRef}
              onChange={handleImagesChanged}
              multiple
            />
            <input
              type='file'
              name='video'
              accept='video/*'
              className='hidden'
              ref={videoInputRef}
              onChange={handleVideoSelect}
            />
            <div className='relative flex h-full flex-col items-center justify-center'>
              {isPreviewing ? (
                <>
                  {captureImage ? (
                    <div
                      style={{
                        flex: '0.6',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        objectFit: 'contain',
                      }}
                    >
                      <Image
                        src={captureImage.url}
                        alt='Capture Photo'
                        width={0}
                        height={0}
                        sizes='100%'
                        style={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'contain',
                          transform:
                            cameraMode === CAMERA_TYPE.FRONT
                              ? 'scaleX(-1)'
                              : 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className='hidden' />
                      <div
                        style={{
                          flex: '0.6',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          objectFit: 'contain',
                        }}
                      >
                        <VideoPlayer source={videoLink!} />
                      </div>
                    </>
                  )}
                  <div
                    className='flex w-full -translate-y-5 flex-col items-center justify-end'
                    style={{ flex: '0.4' }}
                  >
                    {buildAfterCaptureActions}
                  </div>
                </>
              ) : (
                <>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}

                  <Camera errorMessages={{}} ref={cameraRef} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className='absolute bottom-6'>
                    <div
                      className='flex w-full -translate-y-5 flex-col items-center justify-end'
                      style={{ flex: '0.4' }}
                    >
                      {update && <h3>Have mediarecorder</h3>}
                      <h3>{text}</h3>
                      <h3>{action ?? 'No action'}</h3>
                      {buildCaptureActions}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <BodyText type={3} customClassName='text-center'>
              Cannot access camera. Please grant permission or check your
              device.
            </BodyText>
          </div>
        )}
      </div>
    );
  }
);

UploadType.displayName = 'UploadType';

export default UploadType;
