import classNames from 'classnames';
import { isEmpty } from 'lodash';
import { X } from 'lucide-react';
import NextImage from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import Carousel from 'react-multi-carousel';

import { VideoPlayer } from '@/components/video/video-player';

import { ImageSelector } from './image-selector';
import { FileType, UPLOAD_TYPES } from './usePostCreate';
import 'react-multi-carousel/lib/styles.css';

type Props = {
  images: FileType[];
  videoFile?: File;
  uploadType?: UPLOAD_TYPES;
  onImageChanged?: (value: FileType[]) => void;
  onBack?: () => void;
};

export const UploadPreview: React.FC<Props> = ({
  images,
  videoFile,
  uploadType,
  onImageChanged,
  onBack,
}) => {
  const [uploadedImages, setUploadedImages] = useState<FileType[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const carouselRef = useRef<Carousel>(null);
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 0 },
      items: 1,
      partialVisibilityGutter: 0,
    },
  };
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isEmpty(images)) {
      setUploadedImages(images);
    }
    if (videoFile) {
      const videoUrl = URL.createObjectURL(videoFile);
      setVideoUrl(videoUrl);
    }
  }, []);

  const onRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((item, i) => i !== index);
    if (newImages.length === 0) {
      onBack?.();
      return;
    }
    if (index === uploadedImages.length - 1) {
      onUpdatedImages(newImages);
      if (carouselRef.current) {
        carouselRef.current.goToSlide(newImages.length - 1);
        return;
      }
    }
    onUpdatedImages(newImages);
  };

  const reorder = (list: FileType[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed!);

    return result;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderItems = reorder(
      uploadedImages,
      result.source.index,
      result.destination.index
    );

    onUpdatedImages(reorderItems);
  };

  const handleBeforeChange = (nextSlide: number) => {
    setCurrentSlide(nextSlide);
  };

  const onAddMoreImages = (value: File[]) => {
    const formatFile = value.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    const newData = [...uploadedImages, ...formatFile];
    onUpdatedImages(newData);
  };

  const onUpdatedImages = (value: FileType[]) => {
    setUploadedImages(value);
    onImageChanged?.(value);
  };

  const buildImagesCarouselPreview = useMemo(() => {
    return (
      <Carousel
        ref={carouselRef}
        swipeable={true}
        draggable={true}
        showDots={false}
        responsive={responsive}
        ssr={true}
        infinite={false}
        customTransition='all .5'
        transitionDuration={500}
        arrows={false}
        containerClass='carousel-preview-upload-container'
        dotListClass='custom-dot-list-style'
        itemClass='carousel-item-padding-40-px'
        sliderClass='slider-preview-upload'
        beforeChange={(nextSlide) => handleBeforeChange(nextSlide)}
      >
        {uploadedImages.map((image, index) => (
          <div key={index} className='flex h-full items-center'>
            <div className='relative'>
              <div
                className='
                      absolute
                      left-3
                      top-3
                      w-[20px]
                      cursor-pointer
                      rounded-full
                      bg-white
                      p-1
                    '
                tabIndex={-1}
                role='button'
                onClick={() => onRemoveImage(index)}
                onKeyDown={() => onRemoveImage(index)}
              >
                <X size={12} stroke='black' fill='white' />
              </div>
              <NextImage
                src={image.url}
                width={0}
                height={0}
                sizes='70%'
                alt={image.file.name}
                className='rounded-lg'
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        ))}
      </Carousel>
    );
  }, [uploadedImages]);

  const buildVideoPreview = useMemo(() => {
    return (
      videoUrl && (
        <div className='relative'>
          <VideoPlayer source={videoUrl} />
        </div>
      )
    );
  }, [videoUrl]);

  return (
    <div className='flex h-full flex-col'>
      <div
        className={classNames(
          'flex items-center bg-[#dfdfdf] p-4',
          uploadType === UPLOAD_TYPES.IMAGES ? 'flex-[0.95_0.9_0%]' : 'flex-1'
        )}
      >
        <div
          className={classNames(
            'h-full w-full',
            uploadType === UPLOAD_TYPES.VIDEO && 'flex items-center'
          )}
        >
          {uploadType === UPLOAD_TYPES.IMAGES
            ? buildImagesCarouselPreview
            : buildVideoPreview}
        </div>
      </div>
      {uploadType === UPLOAD_TYPES.IMAGES && (
        <div className='p-5'>
          <p>Upload Order</p>
          <div className='mt-2 flex gap-3'>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId='droppable' direction='horizontal'>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className='flex items-center gap-2'
                  >
                    {uploadedImages.map((item, index) => (
                      <Draggable
                        key={item.url}
                        draggableId={item.url}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            className={classNames(
                              'w-10 h-10',
                              currentSlide === index
                                ? 'border-2 border-[#121212] rounded-lg'
                                : ''
                            )}
                            {...provided.dragHandleProps}
                            {...provided.draggableProps}
                          >
                            <NextImage
                              src={item.url}
                              alt={item.file.name}
                              width={0}
                              height={0}
                              sizes='100%'
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px',
                                objectFit: 'cover',
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <ImageSelector onOpenSelectFile={onAddMoreImages} />
          </div>
        </div>
      )}
    </div>
  );
};
