import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard, Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

type NavLink = { label: string; to: "/" | "/marketplace" } | { label: string; href: string };

const LINKS: NavLink[] = [
  { label: "Home", to: "/" },
  { label: "Marketplace", to: "/marketplace" },
  { label: "How it works", href: "/#how" },
  { label: "Insights", href: "/#insights" },
];

/**
 * In-page destinations use a plain anchor: the router has no route for a hash on
 * another page, and a full load is what a visitor expects from a link back home.
 */
function NavAnchor({ link, className }: { link: NavLink; className?: string }) {
  if ("href" in link) {
    return (
      <a href={link.href} className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.to} className={className}>
      {link.label}
    </Link>
  );
}

/**
 * Public chrome for routes anyone can reach. Once a session exists it offers a
 * direct jump into the dashboard rather than repeating the sign-in button.
 */
export function PublicHeader() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboard = session ? (session.role === "admin" ? "/admin" : "/app") : null;

  return (
    <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Likha home">
          <Logo label={null} />
          <span className="font-editorial text-xl">Likha</span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Button key={link.label} variant="ghost" size="sm" asChild>
              <NavAnchor link={link} />
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {dashboard ? (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={signOut}>
                Sign out
              </Button>
              <Button asChild>
                <Link to={dashboard}>
                  <LayoutDashboard data-icon aria-hidden />
                  Dashboard
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">
                  Get started
                  <ArrowRight data-icon aria-hidden />
                </Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu data-icon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5 text-left">
                  <Logo label={null} />
                  <span className="font-editorial text-xl">Likha</span>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="mt-2 flex flex-col gap-1">
                {LINKS.map((link) => (
                  <Button
                    key={link.label}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <NavAnchor link={link} />
                  </Button>
                ))}
                {!session ? (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link to="/login">Sign in</Link>
                  </Button>
                ) : null}
              </nav>
              {dashboard ? (
                <Button className="mt-auto" asChild onClick={() => setOpen(false)}>
                  <Link to={dashboard}>
                    <LayoutDashboard data-icon aria-hidden />
                    Go to dashboard
                  </Link>
                </Button>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p>Likha. Property, with possibility.</p>
        <p>Simulated marketplace. Figures are illustrative and are not an offer of return.</p>
      </div>
    </footer>
  );
}

/** Header, content, footer. Public routes render this instead of an app layout. */
export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div data-touch-targets="" className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
      <PublicFooter />
    </div>
  );
}
