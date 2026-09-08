import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "#/components/auth-layout";
import { Button } from "#/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth/auth-client";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email")).trim(),
        password: String(formData.get("password")),
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message || "Unable to sign in. Please try again.");
      }
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <FieldGroup>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your account.
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
          <FieldSeparator>Or continue with</FieldSeparator>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/" })}
          >
            Sign in with GitHub
          </Button>
          <FieldDescription className="text-center">
            Don't have an account? <Link to="/signup">Create an account</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
