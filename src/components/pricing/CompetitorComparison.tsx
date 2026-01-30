"use client";

import { useState } from "react";
import { Crown, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const competitors = [
  {
    name: "Posh",
    fee: "10% + $0.99",
    on30: "$3.99",
    pct: "13.3%",
    note: "No paid tier — everyone pays the same high fees",
  },
  {
    name: "Eventbrite",
    fee: "3.7% + $1.79 + 2.9% + $0.30",
    on30: "$3.77",
    pct: "12.6%",
    note: "Processing fee added on top of service fee",
  },
  {
    name: "Luma",
    fee: "5% + 2.9% + $0.30",
    on30: "$2.67",
    pct: "8.9%",
    note: "$59/mo to remove 5% — still pay processing",
  },
  {
    name: "Humanitix",
    fee: "2.1% + $0.99 + 2.9% + $0.30",
    on30: "$2.79",
    pct: "9.3%",
    note: "Charity model — limited nightlife features",
  },
];

export function CompetitorComparison() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
      {/* Toggle button */}
      <div className="flex justify-center mb-8">
        <Button
          variant="ghost"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-white text-sm gap-2 group"
        >
          {open ? (
            <>
              Hide comparison
              <ChevronUp className="size-4 group-hover:text-pink transition-colors" />
            </>
          ) : (
            <>
              See how we compare to other platforms
              <ChevronDown className="size-4 group-hover:text-pink transition-colors" />
            </>
          )}
        </Button>
      </div>

      {/* Comparison content — animated reveal */}
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Compare the{" "}
              <span className="text-gradient">real cost</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Total fees on a $30 ticket. Stripe processing included.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 bg-white/[0.03] border-b border-white/10">
              <div className="col-span-3 p-4 text-sm font-medium text-muted-foreground">
                Platform
              </div>
              <div className="col-span-4 p-4 text-sm font-medium text-muted-foreground hidden sm:block">
                Fee Structure
              </div>
              <div className="col-span-4 sm:col-span-2 p-4 text-center text-sm font-medium text-muted-foreground">
                On $30
              </div>
              <div className="col-span-5 sm:col-span-3 p-4 text-sm font-medium text-muted-foreground">
                Note
              </div>
            </div>

            {/* Afters VIP */}
            <div className="grid grid-cols-12 border-b border-pink/20 bg-pink/[0.04]">
              <div className="col-span-3 p-4">
                <span className="text-pink font-bold font-display text-sm flex items-center gap-1.5">
                  <Crown className="size-3.5" /> Afters VIP
                </span>
              </div>
              <div className="col-span-4 p-4 text-sm text-white/80 hidden sm:block">
                2% + $0.50 + processing
              </div>
              <div className="col-span-4 sm:col-span-2 p-4 text-center">
                <span className="text-pink font-bold font-display">$1.77</span>
              </div>
              <div className="col-span-5 sm:col-span-3 p-4 text-xs text-green-400">
                + $45/mo · Lowest total cost
              </div>
            </div>

            {/* Afters Free */}
            <div className="grid grid-cols-12 border-b border-pink/10 bg-pink/[0.02]">
              <div className="col-span-3 p-4">
                <span className="text-white font-bold text-sm">
                  Afters Free
                </span>
              </div>
              <div className="col-span-4 p-4 text-sm text-white/80 hidden sm:block">
                5% + $0.50 + processing
              </div>
              <div className="col-span-4 sm:col-span-2 p-4 text-center">
                <span className="text-white font-bold font-display">
                  $2.67
                </span>
              </div>
              <div className="col-span-5 sm:col-span-3 p-4 text-xs text-green-400">
                No subscription needed
              </div>
            </div>

            {/* Competitors */}
            {competitors.map((c) => (
              <div
                key={c.name}
                className="grid grid-cols-12 border-b border-white/5 hover:bg-white/[0.01] transition-colors"
              >
                <div className="col-span-3 p-4">
                  <span className="text-white/60 text-sm">{c.name}</span>
                </div>
                <div className="col-span-4 p-4 text-sm text-white/40 hidden sm:block">
                  {c.fee}
                </div>
                <div className="col-span-4 sm:col-span-2 p-4 text-center">
                  <span className="text-white/60 font-display">{c.on30}</span>
                </div>
                <div className="col-span-5 sm:col-span-3 p-4 text-xs text-muted-foreground/60">
                  {c.note}
                </div>
              </div>
            ))}
          </div>

          {/* Savings callout */}
          <div className="mt-8 rounded-xl border border-pink/10 bg-pink/[0.02] p-6 text-center">
            <p className="text-white text-sm">
              <span className="font-bold">Sell 200 tickets at $30?</span>{" "}
              <span className="text-muted-foreground">
                On Posh you&apos;d pay{" "}
              </span>
              <span className="text-white/60 line-through">$798 in fees</span>
              <span className="text-muted-foreground">. On Afters VIP: </span>
              <span className="text-pink font-bold font-display">
                $354 + $45 sub
              </span>
              <span className="text-muted-foreground">.</span>
            </p>
            <p className="text-pink font-bold font-display text-lg mt-2">
              That&apos;s $399 saved. Every single event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
