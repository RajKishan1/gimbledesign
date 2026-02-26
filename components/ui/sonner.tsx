"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Refresh01Icon,
  Cancel01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="currentColor" strokeWidth={1.75} />,
        info: <HugeiconsIcon icon={InformationCircleIcon} size={16} color="currentColor" strokeWidth={1.75} />,
        warning: <HugeiconsIcon icon={Alert01Icon} size={16} color="currentColor" strokeWidth={1.75} />,
        error: <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" strokeWidth={1.75} />,
        loading: <HugeiconsIcon icon={Refresh01Icon} size={16} color="currentColor" strokeWidth={1.75} className="animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
