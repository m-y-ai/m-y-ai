"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModelUsage {
  model: string;
  tokens: number;
  cost: number;
}

export function TokenUsage({ models }: { models: ModelUsage[] }) {
  const maxTokens = Math.max(...models.map((m) => m.tokens));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Token Usage by Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map((m) => (
          <div key={m.model} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">{m.model}</span>
              <span className="text-xs text-muted-foreground">
                {(m.tokens / 1000).toFixed(0)}K tokens · ${m.cost.toFixed(2)}
              </span>
            </div>
            <Progress
              value={(m.tokens / maxTokens) * 100}
              className="h-1.5"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
