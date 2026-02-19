"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCents } from "@/lib/stripe";
import { useEventEditor } from "../layout";

export default function TicketsPage() {
  const { event, eventId, refetch } = useEventEditor();
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const uiAccent = useAccentColor();

  if (!event) return null;

  async function createTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTierLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: 0, // Free during beta
      quantity: parseInt(formData.get("quantity") as string),
    };

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Ticket tier created");
        setShowTierDialog(false);
        refetch();
      } else {
        toast.error("Failed to create tier");
      }
    } catch {
      toast.error("Failed to create tier");
    } finally {
      setTierLoading(false);
    }
  }

  async function deleteTier(tierId: string) {
    if (!confirm("Delete this ticket tier?")) return;

    try {
      const res = await fetch(
        `/api/events/${eventId}/ticket-tiers?tierId=${tierId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("Tier deleted");
        refetch();
      } else {
        toast.error("Failed to delete tier");
      }
    } catch {
      toast.error("Failed to delete tier");
    }
  }

  return (
    <div className="space-y-6">
      {/* Ticket Tiers */}
      <div className="border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 tracking-widest">TICKET TIERS</span>
          <button
            onClick={() => setShowTierDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-black text-[10px] font-mono font-bold tracking-wider transition-all"
            style={{ backgroundColor: uiAccent }}
          >
            <Plus className="w-3 h-3" />
            ADD TIER
          </button>
        </div>

        {event.ticketTiers.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-8 h-8 mx-auto text-white/10 mb-3" />
            <p className="text-white/40 font-mono text-sm">No ticket tiers yet</p>
            <button
              onClick={() => setShowTierDialog(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-white/20 text-xs font-mono hover:bg-white/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE FIRST TIER
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {event.ticketTiers.map((tier) => {
              const percentage = tier.quantity > 0 ? Math.round((tier.quantitySold / tier.quantity) * 100) : 0;
              return (
                <div
                  key={tier.id}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-mono font-medium">{tier.name}</p>
                      <span className="text-xs font-mono text-green-400">{formatCents(tier.price)}</span>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-white/40 font-mono mt-0.5">{tier.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono">
                        <span className="text-primary">{tier.quantitySold}</span>
                        <span className="text-white/30">/{tier.quantity}</span>
                      </p>
                      <div className="w-16 h-1 bg-white/5 mt-1">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTier(tier.id)}
                      disabled={tier.quantitySold > 0}
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              Add Ticket Tier
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Create a new ticket type
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createTier} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-mono text-white/50">
                Tier Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="General Admission"
                required
                className="bg-white/[0.02] border-white/10 font-mono focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-mono text-white/50">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Access to main floor"
                className="bg-white/[0.02] border-white/10 font-mono focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-mono text-white/50">
                  Price ($)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value="0"
                  disabled
                  className="bg-white/[0.02] border-white/10 font-mono opacity-50 cursor-not-allowed"
                />
                <p className="text-[10px] font-mono text-primary/60">Free during beta</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-mono text-white/50">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  required
                  className="bg-white/[0.02] border-white/10 font-mono focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-black font-mono font-bold hover:bg-primary/90 transition-all"
              disabled={tierLoading}
            >
              {tierLoading ? "Creating..." : "Create Tier"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
