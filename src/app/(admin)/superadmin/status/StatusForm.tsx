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
import { Plus, Edit2, Trash2 } from "lucide-react"
import { upsertStatus, deleteStatus } from "./actions"
import { toast } from "sonner"

// Define the enums as constants to avoid importing from Prisma client in browser
const SYSTEM_HEALTH_VALUES = ["OPERATIONAL", "MAINTENANCE", "DEPRECATED", "CONSTRUCTION", "DEPLOYING", "DOWN"] as const;
const FEATURE_TYPE_VALUES = ["EVENTS", "DASHBOARD", "LOGIN", "REGISTRATION", "TICKETING", "PROFILE", "PAYMENTS", "API"] as const;

type SystemHealth = typeof SYSTEM_HEALTH_VALUES[number];
type FeatureType = typeof FEATURE_TYPE_VALUES[number];

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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initialData ? (
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-[#ff1493] hover:bg-[#ff1493]/90">
            <Plus className="mr-2 h-4 w-4" /> Add Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Status" : "Add Feature Status"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ticketing, User Profiles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featureType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a feature type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEATURE_TYPE_VALUES.map((featureType) => (
                        <SelectItem key={featureType} value={featureType}>
                          {featureType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SYSTEM_HEALTH_VALUES.map((health) => (
                        <SelectItem key={health} value={health}>
                          {health}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clever Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. We're polishing the glitter. Back in a bit!"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              {initialData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
              <Button type="submit" className="ml-auto bg-[#ff1493] hover:bg-[#ff1493]/90">
                {initialData ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
