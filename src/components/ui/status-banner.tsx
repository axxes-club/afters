"use client";

import { useEffect, useState } from "react";
import { SystemStatus, FeatureType } from "@prisma/client";
import { getStatusesForFeature } from "@/lib/status-utils";
import { AlertCircle, Zap, HardHat, Sparkles, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBannerProps {
  featureType: FeatureType;
}

const STATUS_ICONS = {
  OPERATIONAL: CheckCircle2,
  MAINTENANCE: Zap,
  DEPRECATED: Trash2,
  CONSTRUCTION: HardHat,
  DEPLOYING: Sparkles,
  DOWN: AlertCircle,
};

const STATUS_COLORS = {
  OPERATIONAL: "bg-green-500/10 border-green-500/20 text-green-500",
  MAINTENANCE: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  DEPRECATED: "bg-gray-500/10 border-gray-500/20 text-gray-500",
  CONSTRUCTION: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  DEPLOYING: "bg-purple-500/10 border-purple-500/20 text-purple-500",
  DOWN: "bg-red-500/10 border-red-500/20 text-red-500",
};

export function StatusBanner({ featureType }: StatusBannerProps) {
  const [statuses, setStatuses] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const featureStatuses = await getStatusesForFeature(featureType);
        setStatuses(featureStatuses);
      } catch (error) {
        console.error(`Error fetching statuses for feature ${featureType}:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatuses();

    // Set up polling to refresh statuses every 30 seconds
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [featureType]);

  if (loading || statuses.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {statuses.map((status) => {
            const Icon = STATUS_ICONS[status.status];
            const colorClass = STATUS_COLORS[status.status];

            return (
              <div key={status.id} className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{status.feature}</h4>
                    <Badge variant="outline" className={`border ${colorClass} text-[10px] font-bold uppercase tracking-widest`}>
                      {status.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status.message || "Status update available."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}