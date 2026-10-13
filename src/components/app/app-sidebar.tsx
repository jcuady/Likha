import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, ExternalLink, LogOut, Sparkles, UserRound } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth";
import { navFor } from "./nav-config";

export function AppSidebar() {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navFor(session?.role ?? "investor");
  const name = session?.name ?? "Guest";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Likha home">
              <Link to="/">
                <Logo label={null} />
                <span className="truncate font-editorial text-lg">Likha</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Without a nav landmark there is no way for a screen reader user to
            jump straight to the primary navigation, which is the main reason
            landmarks exist. */}
        <nav aria-label="Main">
          <SidebarGroup>
            <SidebarGroupLabel>
              {session?.role === "admin" ? "Operations" : "Investing"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        {/* exact:true stops TanStack prefix-matching, which would
                          also mark /app as current while on /app/watchlist and
                          leave two aria-current="page" links in the nav. */}
                        <Link to={item.url} activeOptions={{ exact: true }}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Discover</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Browse listings">
                    <Link to="/marketplace">
                      <Sparkles />
                      <span>Browse listings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={name}>
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.role === "admin" ? "Administrator" : "Investor"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium text-sm">{session?.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in as {session?.persona}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app" })}>
                    <UserRound />
                    Investor account
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                    <ExternalLink />
                    Admin workspace
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => {
                    signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  );
}

export function RoleBadge() {
  const { session } = useAuth();
  if (!session) return null;
  return (
    <Badge variant={session.role === "admin" ? "default" : "secondary"}>
      {session.role === "admin" ? "Administrator" : "Investor"}
    </Badge>
  );
}
