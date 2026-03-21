"use client";

import {
  MessageSquare,
  CheckCircle,
  Brain,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/mock-data";

const typeIcon: Record<string, typeof MessageSquare> = {
  message: MessageSquare,
  task: CheckCircle,
  agent: Brain,
  system: Monitor,
};

const typeColor: Record<string, string> = {
  message: "text-blue-400",
  task: "text-emerald-400",
  agent: "text-violet-400",
  system: "text-muted-foreground",
};

export function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {activity.map((item, i) => {
          const Icon = typeIcon[item.type] || Monitor;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 py-2.5",
                i < activity.length - 1 && "border-b border-border"
              )}
            >
              <div className={cn("mt-0.5 shrink-0", typeColor[item.type])}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.timestamp}
                  {item.platform && (
                    <span className="ml-1.5 text-muted-foreground/60">
                      via {item.platform}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
