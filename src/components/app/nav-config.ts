import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LayoutGrid,
  Receipt,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

/**
 * Signed-in investor navigation.
 *
 * No `badge` field here on purpose. A badge on a count that lives in another
 * store is a literal that can only be right until something changes: this
 * sidebar shipped "3" next to a watchlist that starts empty and is toggled
 * from the marketplace, and "8" next to an admin list that create and remove
 * both edit. Counts are supplied per-render by the sidebar, which is the only
 * place that can read the current value. See AppSidebar.
 */
export const investorNav: NavItem[] = [
  { title: "Overview", url: "/app", icon: LayoutDashboard },
  { title: "Explore", url: "/marketplace", icon: LayoutGrid },
  { title: "Portfolio", url: "/app/portfolio", icon: Building2 },
  { title: "Watchlist", url: "/app/watchlist", icon: Star },
  { title: "Statements", url: "/app/statements", icon: Receipt },
];

/** Administrator navigation. Kept separate so role changes need one edit. */
export const adminNav: NavItem[] = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Listings", url: "/admin/listings", icon: Building2 },
  { title: "Investors", url: "/admin/investors", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function navFor(role: "investor" | "admin"): NavItem[] {
  return role === "admin" ? adminNav : investorNav;
}
