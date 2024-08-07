// import { UpChunk } from '@mux/upchunk';
import { useMemo, useRef, useState } from 'react';

// import {
//   requestUploadUrlForVideoPost,
//   uploadImagePost,
// } from 'lib/requests/posts';

export enum UPLOAD_TYPES {
  VIDEO = 'video',
  IMAGES = 'images',
}

export enum POST_STATUS {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

const useTextarea = () => {
  const [text, setText] = useState('');

  return {
    text,
    setText,
  };
};

const useVideoUpload = () => {
  const [videoFile, setVideoFile] = useState<File>();
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // const upload = useRef<UpChunk>();

  // const uploadVideo = async (uploadUrl: string, afterSuccess?: () => void) => {
  //   if (!videoFile) {
  //     return;
  //   }
  //   try {
  //     setUploading(true);
  //     setProgress(0);
  //     upload.current = UpChunk.createUpload({
  //       endpoint: uploadUrl, // Authenticated url
  //       file: videoFile!, // File object with your video file’s properties
  //       chunkSize: 30720, // Uploads the file in ~30 MB chunks
  //     });

  //     const uploadRequest = upload.current;

  //     // Subscribe to events
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     uploadRequest.on('error', (error: any) => {
  //       console.error(error.detail);
  //     });

  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     uploadRequest.on('progress', (progress: any) => {
  //       setProgress(progress.detail);
  //     });

  //     uploadRequest.on('success', () => {
  //       setUploading(false);
  //       setProgress(0);
  //       afterSuccess?.();
  //       console.log("Wrap it up, we're done here. 👋");
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     // setErrorMessage(error);
  //   }
  // };

  // const cancelUpload = () => {
  //   upload.current?.abort();
  //   delete upload.current;
  // };

  return {
    uploading,
    progress,
    videoFile,
    thumbnailFile,
    // uploadVideo,
    // cancelUpload,
    setVideoFile,
    setThumbnailFile,
  };
};

export type FileType = { file: File; url: string };

export const usePostCreate = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [postSubmitting, setPostSubmitting] = useState(false);

  const { text, setText } = useTextarea();

  const [imagesForRequest, setImagesForRequest] = useState<FileType[]>();

  const {
    setVideoFile,
    videoFile,
    thumbnailFile,
    setThumbnailFile,
    progress,
    // uploadVideo,
    uploading,
  } = useVideoUpload();

  const [targetGroup, setTargetGroup] = useState(POST_STATUS.PUBLIC);

  const submitting = useMemo(
    () => postSubmitting || uploading,
    [postSubmitting, uploading]
  );

  const imageFiles = useMemo(
    () => (imagesForRequest ? imagesForRequest : []),
    [imagesForRequest]
  );

  const generateUrl = (value: File) => URL.createObjectURL(value);

  const hasFiles = useMemo(
    () => imageFiles.length > 0 || !!videoFile,
    [imageFiles.length, videoFile]
  );

  const canSubmit = useMemo(
    () => !submitting && hasFiles && !!text,
    [hasFiles, submitting, text]
  );

  const uploadType = useMemo(
    () => (!!videoFile ? UPLOAD_TYPES.VIDEO : UPLOAD_TYPES.IMAGES),
    [videoFile]
  );

  const setNewImages = (list: FileType[]) => {
    setImagesForRequest(list);
  };

  const cleanUp = () => {
    imagesForRequest?.forEach((image) => URL.revokeObjectURL(image.url));
  };

  // const submitPost = async () => {
  //   if (!canSubmit || submitting) {
  //     return;
  //   }
  //   try {
  //     setPostSubmitting(true);
  //     if (uploadType === UPLOAD_TYPES.IMAGES) {
  //       const files = imagesForRequest?.map((item) => item.file);
  //       await uploadImagePost('', text, targetGroup, files!);
  //       onSuccess?.();
  //     } else {
  //       const file = thumbnailFile;
  //       const url = await requestUploadUrlForVideoPost(
  //         '',
  //         text,
  //         targetGroup,
  //         file
  //       );
  //       await uploadVideo(url, onSuccess);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     cleanUp();
  //     setPostSubmitting(false);
  //   }
  // };

  const onTargetGroupChanged = (val: POST_STATUS) => {
    if (val !== targetGroup) {
      setTargetGroup(val);
    }
  };

  const resetMediaState = () => {
    setImagesForRequest(undefined);
    setVideoFile(undefined);
    setThumbnailFile(undefined);
  };

  return {
    submitting,
    hasFiles,
    text,
    canSubmit,
    progress,
    videoFile,
    targetGroup,
    imageFiles,
    uploadType,
    generateUrl,
    // uploadVideo,
    setText,
    setNewImages,
    // submitPost,
    setVideoFile,
    setThumbnailFile,
    onTargetGroupChanged,
    resetMediaState,
  };
};
