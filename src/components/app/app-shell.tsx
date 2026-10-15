import { Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { CircleHelp, Compass, Search } from "lucide-react";
import { useRef } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { navFor } from "@/components/app/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Gate for the signed-in surfaces. The session lives in localStorage, so the
 * check can only run on the client: the server and the first client render both
 * show the skeleton, and the redirect happens once `ready` flips. Doing this in
 * a router `beforeLoad` would bounce signed-in visitors to /login on every
 * hard refresh, because the server has no session to see.
 */
export function RequireAuth({
  role,
  children,
}: {
  role: "investor" | "admin";
  children: React.ReactNode;
}) {
  const { session, ready } = useAuth();

  if (!ready) return <ShellSkeleton />;
  if (!session) return <Navigate to="/login" />;
  // An administrator landing in the investor workspace keeps their own session
  // but is sent to the operations side, which is the only one they should see.
  if (session.role !== role && role === "admin") return <Navigate to="/app" />;

  return <>{children}</>;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <Skeleton className="h-9 w-32" />
        <div className="mt-8 flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

/**
 * Shared chrome for every signed-in route. `role` selects the navigation set so
 * the investor and admin surfaces stay visually identical while their links differ.
 */
export function AppShell({ role }: { role: "investor" | "admin" }) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const items = navFor(session?.role ?? role);

  // Longest-prefix match so /app/portfolio highlights Portfolio, not Overview.
  const active = [...items]
    .sort((a, b) => b.url.length - a.url.length)
    .find((item) => {
      if (item.url === "/app" || item.url === "/admin") return location.pathname === item.url;
      return location.pathname.startsWith(item.url);
    }) ?? { title: "Likha", url: "/", icon: Compass };

  return (
    <SidebarProvider>
      {/* `contents` keeps the sidebar and inset as direct flex children of the
          provider while still scoping the touch-target floor to this surface. */}
      <div data-touch-targets="" className="contents">
        <AppSidebar />
        {/* min-w-0: the inset is a flex item, so its default min-width:auto lets
            it stay at its content's intrinsic width instead of shrinking. At
            exactly the md breakpoint (768px) the sidebar is expanded to 256px,
            leaving 512px, and the inset held 561px — 49px of horizontal
            overflow on every dashboard with a table or chart. */}
        <SidebarInset className="min-w-0">
          <header
            data-app-header
            className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-md md:px-6"
          >
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-5 max-sm:hidden" />

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="truncate text-sm font-medium leading-tight">{active.title}</span>
              <span className="truncate text-xs leading-tight text-muted-foreground max-sm:hidden">
                {role === "admin" ? "Operations workspace" : "Investor account"}
              </span>
            </div>

            {/* The header search is wired to the marketplace query string rather than
            filtering the current page. It used to be an uncontrolled input with
            no value, no handler and no form: a text field that accepted
            keystrokes and discarded them. */}
            <form
              action="/marketplace"
              role="search"
              className="hidden w-64 lg:block"
              onSubmit={(event) => {
                event.preventDefault();
                const value = searchRef.current?.value.trim();
                navigate({ to: "/marketplace", search: value ? { q: value } : {} });
              }}
            >
              <div className="relative">
                <Search
                  data-icon
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={searchRef}
                  type="search"
                  name="q"
                  placeholder="Search listings"
                  aria-label="Search listings"
                  className="h-9 pl-9"
                />
              </div>
            </form>

            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => navigate({ to: "/marketplace" })}
            >
              <Search data-icon aria-hidden />
              Browse
            </Button>

            {/* No bell. There is no notification data anywhere in this build, and
                an aria-label of "Notifications, 2 unread" told screen-reader
                users about two messages that do not exist. */}

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            <Button variant="ghost" size="icon" asChild>
              <Link to="/" aria-label="Back to the Likha site">
                <CircleHelp data-icon />
              </Link>
            </Button>
          </header>

          <div className={cn("flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8")}>
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

/** Consistent page heading for every route inside the app shell. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0">
        <h1 className="font-editorial text-3xl leading-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
