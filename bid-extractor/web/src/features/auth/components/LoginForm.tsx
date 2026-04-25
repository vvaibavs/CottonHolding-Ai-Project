import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onPasswordLogin(values: LoginValues) {
    setError(null);
    setMessage(null);
    const { error: err } = await supabase.auth.signInWithPassword(values);
    if (err) {
      if (err.message.includes("Invalid login")) {
        const { error: signUpErr } = await supabase.auth.signUp(values);
        if (signUpErr) {
          setError(signUpErr.message);
        } else {
          setMessage("Account created! Check your email to confirm, then sign in.");
        }
      } else {
        setError(err.message);
      }
    }
  }

  async function onMagicLink() {
    setError(null);
    setMessage(null);
    const email = getValues("email");
    if (!email) {
      setError("Enter your email first");
      return;
    }
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) {
      setError(err.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
          Bid Extractor
        </h1>
        <div className="mx-auto mt-3 h-px w-12 bg-border" />
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to continue
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="bg-background"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {mode === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-background"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-blue-400">{message}</p>}

          {mode === "password" ? (
            <div className="space-y-3 pt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In / Sign Up"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMode("magic")}
              >
                Use magic link instead
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                className="w-full"
                onClick={onMagicLink}
                disabled={isSubmitting}
              >
                Send Magic Link
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMode("password")}
              >
                Use password instead
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
