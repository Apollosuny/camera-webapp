export enum REACTION_TYPE {
  like = 'like',
  repost = 'repost',
  comment = 'comment',
}

export enum CAMERA_TYPE {
  FRONT = 'user',
  REAR = 'environment',
}

export const maximumUploadedImages = 10;

export const imageLimitSize = 5 * 1024 * 1024; // 5MB
export const videoLimitSize = 100 * 1024 * 1024; // 100MB

export const mimeType = 'video/mp4';
/**
 * Minus 1 second to get the correct duration
 * Example: expect duration is 15s --> maxDuration is 14s
 */
export const maxDuration = 14;
