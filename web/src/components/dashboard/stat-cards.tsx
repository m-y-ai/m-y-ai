"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { StatCard } from "@/lib/mock-data";

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColor = {
  up: "text-emerald-500",
  down: "text-emerald-500", // cost going down is good
  neutral: "text-muted-foreground",
};

export function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat) => {
        const Icon = trendIcon[stat.trend];
        return (
          <Card key={stat.label} className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight mt-1">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <Icon
                  className={cn("w-3 h-3", trendColor[stat.trend])}
                />
                <span className="text-xs text-muted-foreground">
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
