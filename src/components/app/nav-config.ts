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
  badge?: string;
};

/** Signed-in investor navigation. */
export const investorNav: NavItem[] = [
  { title: "Overview", url: "/app", icon: LayoutDashboard },
  { title: "Explore", url: "/marketplace", icon: LayoutGrid },
  { title: "Portfolio", url: "/app/portfolio", icon: Building2 },
  { title: "Watchlist", url: "/app/watchlist", icon: Star, badge: "3" },
  { title: "Statements", url: "/app/statements", icon: Receipt },
];

/** Administrator navigation. Kept separate so role changes need one edit. */
export const adminNav: NavItem[] = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Listings", url: "/admin/listings", icon: Building2, badge: "8" },
  { title: "Investors", url: "/admin/investors", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function navFor(role: "investor" | "admin"): NavItem[] {
  return role === "admin" ? adminNav : investorNav;
}
