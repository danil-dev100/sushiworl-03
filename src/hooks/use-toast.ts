"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const useToast = () => {
  const toast = ({ title, description, action, ...props }: ToastProps & { variant?: "default" | "destructive" }) => {
    const { variant = "default" } = props

    if (variant === "destructive") {
      return sonnerToast.error(title || description, {
        description: description && title ? description : undefined,
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      })
    }

    return sonnerToast.success(title || description, {
      description: description && title ? description : undefined,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  }

  return { toast }
}
