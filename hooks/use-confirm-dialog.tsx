"use client"

import { useState, useCallback } from "react"

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  description: string
  confirmText: string
  cancelText: string
  variant: "default" | "destructive"
  onConfirm: () => void
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    variant: "default",
    onConfirm: () => {},
  })

  const confirm = useCallback(
    (options: {
      title: string
      description: string
      confirmText?: string
      cancelText?: string
      variant?: "default" | "destructive"
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || "Aceptar",
          cancelText: options.cancelText || "Cancelar",
          variant: options.variant || "default",
          onConfirm: () => {
            resolve(true)
            setDialogState((prev) => ({ ...prev, isOpen: false }))
          },
        })
      })
    },
    [],
  )

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    dialogState,
    confirm,
    closeDialog,
  }
}
