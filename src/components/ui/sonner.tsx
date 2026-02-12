"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      offset={16}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full flex items-center gap-3 p-4 bg-black border border-white/10 font-mono text-sm",
          title: "text-white",
          description: "text-white/50 text-xs",
          success: "border-[#ff1493]/30 [&_svg]:text-[#ff1493]",
          error: "border-red-500/30 [&_svg]:text-red-400",
          warning: "border-yellow-500/30 [&_svg]:text-yellow-400",
          info: "border-white/20 [&_svg]:text-white/60",
          actionButton: "bg-[#ff1493] text-black px-3 py-1.5 text-xs font-bold tracking-wider",
          cancelButton: "bg-white/10 text-white px-3 py-1.5 text-xs tracking-wider",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
