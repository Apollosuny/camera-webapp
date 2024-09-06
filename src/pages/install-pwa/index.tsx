'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = {}

let deferredPrompt: any
const pwaUrl = 'https://camera-webapp.vercel.app'
const InstallPWA: React.FC<Props> = () => {
  const [installable, setInstallable] = useState<boolean>(false)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', e => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      deferredPrompt = e
      // Update UI notify the user they can install the PWA
      setInstallable(true)
    })

    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('INSTALL: Success')
    })
  }, [])

  const handleInstallClick = (e: any) => {
    // Hide the app provided install promotion
    setInstallable(false)
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
    })
  }

  const onOpenPWA = () => {
    window.location.href = pwaUrl
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>Install Demo</h2>
        {installable && (
          <button className="install-button" onClick={handleInstallClick}>
            INSTALL ME
          </button>
        )}
      </header>
      <div className="mt-4 text-center">
        <Link href="/camera">Camera</Link>
      </div>
      <div className="mt-10">
        <button type="button" className="h-20 w-40" onClick={onOpenPWA}>
          Open PWA
        </button>
      </div>
    </div>
  )
}

export default InstallPWA
