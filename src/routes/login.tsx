import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building2, Eye, EyeOff, ShieldCheck, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { personas, useAuth } from "@/lib/auth";
import { absoluteUrl } from "@/lib/site";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | Likha" },
      {
        name: "description",
        content:
          "Sign in to your Likha account to track your holdings, rent income, and property statements.",
      },
      // No value in ranking a sign-in form, and it should never compete with
      // the sign-up page for the same query.
      { name: "robots", content: "noindex, follow" },
      { property: "og:url", content: absoluteUrl("/login") },
      { property: "og:title", content: "Sign in | Likha" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/login") }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signInAs } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = (values: FormValues) => {
    const persona = personas.find((p) => p.session.email === values.email);
    // No backend yet: any well-formed credential lands on the persona that owns
    // the address, defaulting to the investor account.
    const target = persona ?? personas[0];
    if (!target) return;
    signInAs(target.id);
    toast.success(`Signed in as ${target.label}`, { description: target.session.name });
    navigate({ to: target.session.role === "admin" ? "/admin" : "/app" });
  };

  const quickSignIn = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    signInAs(persona.id);
    toast.success(`Signed in as ${persona.label}`, { description: persona.session.name });
    navigate({ to: persona.session.role === "admin" ? "/admin" : "/app" });
  };

  return (
    <AuthShell>
      <div>
        <h1 className="font-editorial text-3xl leading-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access your holdings, income, and watchlist.
        </p>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test an account</CardTitle>
          <CardDescription className="text-xs">
            No password needed. Pick a role to see the app from that side.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {personas.map((persona) => {
            const Icon =
              persona.session.role === "admin"
                ? ShieldCheck
                : persona.id === "investor"
                  ? TrendingUp
                  : Building2;
            return (
              <Button
                key={persona.id}
                variant="outline"
                onClick={() => quickSignIn(persona.id)}
                className="h-auto w-full justify-start gap-3 px-3 py-2.5 text-left"
              >
                <Avatar className="size-9 shrink-0 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">{persona.initials}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{persona.label}</span>
                    <Icon data-icon aria-hidden className="size-3.5 text-muted-foreground" />
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {persona.blurb}
                  </span>
                </span>
                <ArrowRight
                  data-icon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() =>
                toast.info("Password reset is not connected yet", {
                  description: "This build has no email provider. Use a test account above.",
                })
              }
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-11"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 w-11 rounded-none"
            >
              {showPassword ? <EyeOff data-icon /> : <Eye data-icon />}
            </Button>
          </div>
          {form.formState.errors.password ? (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <label htmlFor="remember" className="flex min-h-11 cursor-pointer items-center gap-3">
          <Controller
            control={form.control}
            name="remember"
            render={({ field }) => (
              <Checkbox
                id="remember"
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <span className="text-sm text-muted-foreground">Keep me signed in on this device</span>
        </label>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Likha?{" "}
        <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        This is a demonstration build. Accounts are stored in your browser only and no data leaves
        this device.
      </p>
    </AuthShell>
  );
}
