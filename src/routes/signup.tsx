import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { absoluteUrl } from "@/lib/site";

/**
 * Investor only, deliberately. This form used to offer an administrator role,
 * which meant a public sign-up page could mint an admin session and land on the
 * operations workspace. Even with a simulated auth provider that is the wrong
 * shape: role selection belongs in an internal invite flow, not on a page whose
 * heading is "Create your account". The admin surface stays reachable through
 * the clearly-labelled test accounts on /login, where choosing a role is the
 * stated purpose of the control.
 */
const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
  terms: z.boolean().refine((accepted) => accepted, "Accept the terms to continue"),
});

type FormValues = z.infer<typeof schema>;

const PERKS: string[] = [
  "Browse every live listing with the full rent history",
  "Buy a share from 1% and collect rent monthly",
  "Track income, occupancy, and payouts in one place",
];

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Likha account" },
      {
        name: "description",
        content:
          "Open a Likha investor account and browse live listings. This build creates no account and sends no data.",
      },
      { property: "og:url", content: absoluteUrl("/signup") },
      { property: "og:title", content: "Create your Likha account" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/signup") }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", terms: false },
  });

  const onSubmit = (values: FormValues) => {
    signIn({
      name: values.name,
      email: values.email,
      role: "investor",
      persona: "Investor",
    });
    // Not "Account created": nothing is registered anywhere. auth.tsx writes a
    // key to this browser and the profile is discarded on reload.
    toast.success("Demo session started", {
      description: `Signed in as ${values.name.split(" ")[0]}. Nothing was registered or sent anywhere.`,
    });
    navigate({ to: "/app" });
  };

  return (
    <AuthShell>
      <div>
        <h1 className="font-editorial text-3xl leading-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Free to join. Nothing is charged until you subscribe to a listing.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use 8 or more characters with a letter and a number.
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-1.5 rounded-xl bg-secondary/50 p-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check data-icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {perk}
            </li>
          ))}
        </ul>

        <label htmlFor="terms" className="flex cursor-pointer items-start gap-3">
          <Checkbox
            id="terms"
            className="mt-0.5"
            checked={form.watch("terms")}
            onCheckedChange={(checked) =>
              form.setValue("terms", checked === true, { shouldValidate: true })
            }
            aria-invalid={Boolean(form.formState.errors.terms)}
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            I agree to the Terms of Service and Privacy Policy, and I understand property investment
            carries risk including possible loss of capital.
          </span>
        </label>
        {form.formState.errors.terms ? (
          <p role="alert" className="-mt-2 text-xs text-destructive">
            {form.formState.errors.terms.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        This is a demonstration build. No account is created and nothing leaves your browser. To see
        the operations side, use the administrator test account on the{" "}
        <Link to="/login" className="underline underline-offset-4">
          sign-in page
        </Link>
        .
      </p>
    </AuthShell>
  );
}

/** Password input with a reveal toggle, used by sign-up. */
function PasswordField({
  id,
  invalid,
  ...props
}: React.ComponentProps<"input"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="pr-11"
        aria-invalid={invalid}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 w-11 rounded-none"
      >
        {visible ? <EyeOff data-icon /> : <Eye data-icon />}
      </Button>
    </div>
  );
}
