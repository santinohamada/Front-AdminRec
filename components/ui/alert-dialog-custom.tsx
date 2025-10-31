"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AlertDialogCustomProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export function AlertDialogCustom({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = "default",
}: AlertDialogCustomProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onConfirm && <AlertDialogCancel onClick={onClose}>{cancelText}</AlertDialogCancel>}
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === "destructive" ? "bg-destructive text-amber-50 hover:bg-destructive/90" : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
