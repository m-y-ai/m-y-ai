"use client";

import Link from "next/link";
import { Menu, Brain } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, getAllSubItems } from "@/lib/constants";
import { useActiveNav } from "@/hooks/use-active-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { activeSection, pathname } = useActiveNav();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              m-y-ai
            </SheetTitle>
          </SheetHeader>

          <Separator />

          <ScrollArea className="flex-1 h-[calc(100vh-57px)]">
            <nav className="p-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection?.id === item.id;
                const subItems = item.subItems || [];
                const subGroups = item.subGroups;

                return (
                  <div key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>

                    {isActive && subItems.length > 0 && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {subItems.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                              pathname === sub.href
                                ? "text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {sub.icon && (
                              <sub.icon className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {isActive && subGroups && (
                      <div className="ml-6 mt-0.5 space-y-2">
                        {subGroups.map((group) => (
                          <div key={group.id}>
                            <p className="px-3 py-1 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                              {group.label}
                            </p>
                            {group.items.map((sub) => (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                                  pathname === sub.href
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {sub.icon && (
                                  <sub.icon className="w-3.5 h-3.5 shrink-0" />
                                )}
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
