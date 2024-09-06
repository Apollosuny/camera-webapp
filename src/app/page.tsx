import UploadContentLayout from '@/pages/camera'
import InstallPWA from '@/pages/install-pwa'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* <UploadContentLayout /> */}
      <InstallPWA />
    </main>
  )
}
