'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

type Toast = {
  id: string
  title: string
  description?: string
  type?: 'success' | 'info' | 'warning' | 'error'
}

const ToastContext = React.createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in
                ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
                ${toast.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
                ${toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : ''}
                ${!toast.type || toast.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
              `}
            >
              <div className="flex-1">
                <div className={`
                  font-semibold text-sm
                  ${toast.type === 'success' ? 'text-green-900' : ''}
                  ${toast.type === 'error' ? 'text-red-900' : ''}
                  ${toast.type === 'warning' ? 'text-yellow-900' : ''}
                  ${!toast.type || toast.type === 'info' ? 'text-blue-900' : ''}
                `}>
                  {toast.title}
                </div>
                {toast.description && (
                  <div className={`
                    text-sm mt-1
                    ${toast.type === 'success' ? 'text-green-700' : ''}
                    ${toast.type === 'error' ? 'text-red-700' : ''}
                    ${toast.type === 'warning' ? 'text-yellow-700' : ''}
                    ${!toast.type || toast.type === 'info' ? 'text-blue-700' : ''}
                  `}>
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
