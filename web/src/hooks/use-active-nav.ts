"use client";

import { usePathname } from "next/navigation";
import {
  NAV_ITEMS,
  findNavItem,
  findSubItem,
  type NavItem,
  type NavSubItem,
} from "@/lib/constants";

export function useActiveNav(): {
  activeSection: NavItem | undefined;
  activeSubItem: NavSubItem | undefined;
  pathname: string;
} {
  const pathname = usePathname();
  const activeSection = findNavItem(pathname);
  const activeSubItem = activeSection
    ? findSubItem(activeSection, pathname)
    : undefined;

  return { activeSection, activeSubItem, pathname };
}
