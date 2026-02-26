import { HugeiconsIcon } from "@hugeicons/react"
import { Refresh01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

function Spinner({ className }: { className?: string }) {
  return (
    <HugeiconsIcon
      icon={Refresh01Icon}
      size={16}
      color="currentColor"
      strokeWidth={1.75}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

export { Spinner }
