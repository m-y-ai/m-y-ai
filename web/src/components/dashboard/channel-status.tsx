"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChannelStatus } from "@/lib/mock-data";

export function ChannelStatusCard({ channels }: { channels: ChannelStatus[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Channels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.map((ch) => (
          <div
            key={ch.platform}
            className="flex items-center justify-between py-1.5"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  ch.connected ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
              />
              <span className="text-sm">{ch.name}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {ch.connected ? `${ch.messagesTotal} msgs` : "offline"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
