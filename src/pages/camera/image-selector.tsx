import classNames from 'classnames';
import { Image, Plus } from 'lucide-react';
import React, { ChangeEvent, useCallback, useRef } from 'react';

type Props = {
  onOpenSelectFile?: (value: File[]) => void;
  multiple?: boolean;
  hasText?: boolean;
};

const imageLimitSize = 5 * 1024 * 1024;

const ImageSelector: React.FC<Props> = ({
  multiple = true,
  hasText = false,
  onOpenSelectFile,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const openImagesSelector = useCallback(
    () => imageInputRef.current?.click(),
    []
  );

  const handleImagesChanged = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (multiple && files.length > 10) {
        return;
      }
      if (!multiple && files.length > 1) {
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
      onOpenSelectFile?.(Array.from(e.target.files));
    }
  };

  return (
    <div className={classNames(hasText && 'w-full')}>
      <input
        type='file'
        name='myImage'
        accept='image/*'
        className='hidden'
        ref={imageInputRef}
        onChange={handleImagesChanged}
        multiple={multiple}
      />
      {hasText ? (
        <div
          className='flex items-center justify-center gap-1 rounded-lg bg-[#121212] py-3'
          tabIndex={-1}
          role='button'
          onClick={openImagesSelector}
          onKeyDown={openImagesSelector}
        >
          <Image size={14} stroke='white' />
          <span className='text-[15px] font-bold text-white'>
            Pick from Photos
          </span>
        </div>
      ) : (
        <div
          className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#C4C4C4]'
          role='button'
          tabIndex={-1}
          onClick={openImagesSelector}
          onKeyDown={openImagesSelector}
        >
          <Plus size={24} stroke='white' />
        </div>
      )}
    </div>
  );
};
export default ImageSelector;
