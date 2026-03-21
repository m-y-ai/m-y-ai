"use client";

import { useState, useRef, useCallback } from "react";
import {
  Send,
  Brain,
  ChevronDown,
  Paperclip,
  Mic,
  AtSign,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AGENTS, MODELS, type AgentOption, type ModelOption } from "@/lib/mock-data";

export function QuickComposer() {
  const [text, setText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentOption>(AGENTS[0]);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    // TODO: wire to gateway WebSocket
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Card className="p-0 overflow-hidden">
      {/* Textarea */}
      <div className="px-4 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, assign a task, or start a conversation..."
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-3 gap-2">
        {/* Left: selectors */}
        <div className="flex items-center gap-1.5">
          {/* Agent selector */}
          <Popover open={agentOpen} onOpenChange={setAgentOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                />
              }
            >
              <AtSign className="w-3.5 h-3.5" />
              <span className="max-w-[80px] truncate">{selectedAgent.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1" sideOffset={8}>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Select Agent
              </p>
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setAgentOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent",
                    selectedAgent.id === agent.id && "bg-accent"
                  )}
                >
                  <Brain className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {agent.description}
                    </p>
                  </div>
                  {selectedAgent.id === agent.id && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Model selector */}
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                />
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{selectedModel.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-1" sideOffset={8}>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Select Model
              </p>
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setModelOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent",
                    selectedModel.id === model.id && "bg-accent"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{model.name}</span>
                      {model.tag && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 font-medium"
                        >
                          {model.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {model.provider}
                    </p>
                  </div>
                  {selectedModel.id === model.id && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Attachment */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </Button>

          {/* Voice */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Mic className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right: send */}
        <Button
          size="sm"
          className="h-7 gap-1.5 px-3"
          disabled={!text.trim()}
          onClick={handleSubmit}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="text-xs">Send</span>
        </Button>
      </div>
    </Card>
  );
}
