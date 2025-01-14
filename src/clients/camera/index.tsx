'use client'

import { ChevronLeft } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import UploadPreview from './upload-preview'
import UploadType, { UploadTypeRef } from './upload-type'
import { FileType, POST_STATUS, usePostCreate } from '@/lib/hooks/usePostCreate'
import { BodyText } from '@/components/typography/body-text'
import MainUploadSection from './upload-info'

const STEP = {
  TYPE: 0,
  PREVIEW: 1,
  DETAILS: 2,
}

const UploadContentLayout: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(STEP.TYPE)
  const [showDiscardPost, setShowDiscardPost] = useState<boolean>(false)
  const uploadTypeRef = useRef<UploadTypeRef>(null)

  const state = usePostCreate({
    onSuccess: () => {},
  })

  const handleNext = () => {
    if (uploadTypeRef.current) {
      uploadTypeRef.current.onCloseCamrera()
    }
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    if (activeStep === STEP.TYPE) {
      if (uploadTypeRef.current) {
        const uploadType = uploadTypeRef.current
        if (uploadType.isPreviewing) {
          uploadType.onResetState()
          return
        } else {
          uploadTypeRef.current.onCloseCamrera()
          return
        }
      }
    }
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const onImageUploaded = (value: File[]) => {
    const data = value.map(file => ({
      file,
      url: state.generateUrl(file),
    }))
    state.setNewImages(data)
  }

  const onImageChanged = (value: FileType[]) => {
    state.setNewImages(value)
  }

  const onVideoChanged = (value: File) => {
    state.setVideoFile(value)
  }

  const handleBackToCamera = () => {
    state.resetMediaState()
    setActiveStep(STEP.TYPE)
  }

  const renderUploadContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <UploadType
            ref={uploadTypeRef}
            onImagesChanged={onImageUploaded}
            onVideoChanged={onVideoChanged}
          />
        )
      case 1:
        return (
          <UploadPreview
            images={state.imageFiles}
            videoFile={state.videoFile}
            uploadType={state.uploadType}
            onImageChanged={onImageChanged}
            onBack={handleBackToCamera}
          />
        )
      case 2:
        return (
          <MainUploadSection
            images={state.imageFiles}
            hasFiles={state.hasFiles}
            videoFile={state.videoFile}
            submitting={state.submitting}
            progress={state.progress}
            text={state.text}
            targetGroup={state.targetGroup}
            canSubmit={state.canSubmit}
            onTextChanged={state.setText}
            onTargetGroupChanged={(val: POST_STATUS) =>
              state.onTargetGroupChanged(val)
            }
            setThumbnailFile={state.setThumbnailFile}
          />
        )
      default:
        return 'Default step'
    }
  }

  useEffect(() => {
    if (state.hasFiles && activeStep === STEP.TYPE) {
      handleNext()
    }
  }, [state.imageFiles, state.videoFile])

  return (
    <div className="fixed left-1/2 top-0 z-[100] flex h-full w-full max-w-md -translate-x-1/2 flex-col justify-between bg-mainGrey">
      <div className="flex w-full grow flex-col">
        <Header
          currentStep={activeStep}
          onShowDiscardPost={() => setShowDiscardPost(true)}
          prev={handleBack}
          next={handleNext}
        />
        {renderUploadContent(activeStep)}
      </div>
    </div>
  )
}

export default UploadContentLayout

type HeaderProps = {
  currentStep: number
  onShowDiscardPost: () => void
  prev: () => void
  next: () => void
}

const Header: React.FC<HeaderProps> = ({ currentStep, prev, next }) => {
  return (
    <div className="relative flex items-center border-b border-grey-200 bg-grey-50 px-5 py-4">
      <div
        className="flex flex-[0.2_1_0%] flex-row items-center gap-x-2"
        role="button"
        onClick={prev}
        onKeyDown={prev}
        tabIndex={-1}
      >
        <ChevronLeft size={20} />
        <BodyText type={1}>Back</BodyText>
      </div>
      <div className="flex-[0.6_1_0%] text-center">
        <BodyText type={3}>New Post</BodyText>
      </div>
      {currentStep === STEP.PREVIEW && (
        <div
          className="flex-[0.2_1_0%] text-end"
          onClick={next}
          onKeyDown={next}
          role="button"
          tabIndex={-1}
        >
          <BodyText type={3} customClassName="text-[var(--color-mainGreen)]">
            Next
          </BodyText>
        </div>
      )}
    </div>
  )
}
