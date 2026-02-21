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
```

5. Commit: "Add: viewport fix component"

---

## 📍 **IMPORTANTE - POSIZIONE:**

Il file DEVE essere qui:
```
lynqly-app/
└── app/
    ├── layout.tsx
    └── viewport-fix.tsx  ← QUI!
