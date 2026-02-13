"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import { upsertStatus, deleteStatus } from "./actions"
import { toast } from "sonner"

const SYSTEM_HEALTH_VALUES = ["OPERATIONAL", "MAINTENANCE", "DEPRECATED", "CONSTRUCTION", "DEPLOYING", "DOWN"] as const
const FEATURE_TYPE_VALUES = ["EVENTS", "DASHBOARD", "LOGIN", "REGISTRATION", "TICKETING", "PROFILE", "PAYMENTS", "API"] as const

type SystemHealth = typeof SYSTEM_HEALTH_VALUES[number]
type FeatureType = typeof FEATURE_TYPE_VALUES[number]

const healthLabels: Record<SystemHealth, { label: string; color: string }> = {
  OPERATIONAL: { label: "Online", color: "text-green-400" },
  MAINTENANCE: { label: "Maintenance", color: "text-yellow-400" },
  DEPRECATED: { label: "Deprecated", color: "text-white/40" },
  CONSTRUCTION: { label: "Building", color: "text-blue-400" },
  DEPLOYING: { label: "Deploying", color: "text-purple-400" },
  DOWN: { label: "Offline", color: "text-red-400" },
}

const formSchema = z.object({
  feature: z.string().min(2, "Feature name must be at least 2 characters"),
  featureType: z.enum(FEATURE_TYPE_VALUES),
  status: z.enum(SYSTEM_HEALTH_VALUES),
  message: z.string().optional(),
})

interface StatusFormProps {
  initialData?: {
    id: string
    feature: string
    featureType: FeatureType
    status: SystemHealth
    message: string | null
  }
}

export function StatusForm({ initialData }: StatusFormProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feature: initialData?.feature || "",
      featureType: initialData?.featureType || "EVENTS",
      status: initialData?.status || "OPERATIONAL",
      message: initialData?.message || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await upsertStatus({
        id: initialData?.id,
        ...values,
      })
      toast.success(initialData ? "Status updated" : "Status created")
      setOpen(false)
      if (!initialData) form.reset()
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function onDelete() {
    if (!initialData) return
    setIsDeleting(true)
    try {
      await deleteStatus(initialData.id)
      toast.success("Status deleted")
      setOpen(false)
    } catch {
      toast.error("Failed to delete")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setShowDeleteConfirm(false) }}>
      <DialogTrigger asChild>
        {initialData ? (
          <Button variant="ghost" size="icon" className="hover:bg-white/10">
            <Edit2 className="h-4 w-4 text-white/40 hover:text-white" />
          </Button>
        ) : (
          <Button className="bg-[#ff1493] hover:bg-[#ff1493]/90 font-mono text-xs tracking-wider">
            <Plus className="mr-2 h-4 w-4" /> ADD SERVICE
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 sm:max-w-md">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="font-mono text-lg tracking-tight">
            {initialData ? "EDIT SERVICE STATUS" : "ADD NEW SERVICE"}
          </DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4 py-4">
            <div className="border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-mono font-bold text-red-400">CONFIRM DELETION</p>
                  <p className="text-sm text-white/60 mt-1">
                    Are you sure you want to delete &quot;{initialData?.feature}&quot;? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="font-mono text-xs"
              >
                CANCEL
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 font-mono text-xs"
              >
                {isDeleting ? "DELETING..." : "DELETE"}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="feature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono text-white/40 tracking-widest">SERVICE NAME</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Event Creation, User Authentication"
                        className="font-mono bg-white/5 border-white/10 focus:border-[#ff1493]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs font-mono" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featureType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono text-white/40 tracking-widest">CATEGORY</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-mono bg-white/5 border-white/10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black border-white/10">
                        {FEATURE_TYPE_VALUES.map((featureType) => (
                          <SelectItem
                            key={featureType}
                            value={featureType}
                            className="font-mono text-sm focus:bg-[#ff1493]/20 focus:text-white"
                          >
                            {featureType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs font-mono" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono text-white/40 tracking-widest">STATUS</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-mono bg-white/5 border-white/10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black border-white/10">
                        {SYSTEM_HEALTH_VALUES.map((health) => (
                          <SelectItem
                            key={health}
                            value={health}
                            className="font-mono text-sm focus:bg-[#ff1493]/20 focus:text-white"
                          >
                            <span className={healthLabels[health].color}>
                              {healthLabels[health].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs font-mono" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono text-white/40 tracking-widest">STATUS MESSAGE</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: Add a message to display to users"
                        className="font-mono bg-white/5 border-white/10 focus:border-[#ff1493] min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs font-mono" />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-2">
                {initialData && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono text-xs"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> DELETE
                  </Button>
                )}
                <Button
                  type="submit"
                  className="ml-auto bg-[#ff1493] hover:bg-[#ff1493]/90 font-mono text-xs tracking-wider"
                >
                  {initialData ? "UPDATE" : "CREATE"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
