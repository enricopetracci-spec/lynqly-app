 'use client'

import { useEffect } from 'react'

export default function ViewportFix() {
  useEffect(() => {
    const existingViewport = document.querySelector('meta[name="viewport"]')
    if (existingViewport) {
      existingViewport.remove()
    }

    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    document.head.appendChild(meta)
  }, [])

  return null
}
