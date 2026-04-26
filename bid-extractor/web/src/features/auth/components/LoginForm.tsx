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
        const { error: signUpErr } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpErr) {
          setError(signUpErr.message);
        } else {
          setMessage("Account created! Signing you in...");
          const { error: loginErr } = await supabase.auth.signInWithPassword(values);
          if (loginErr) setError(loginErr.message);
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
    <div className="w-full max-w-sm animate-slide-up">
      <div className="mb-10 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Document Intelligence
        </p>
        <h1 className="font-serif text-5xl font-normal tracking-tight text-foreground">
          Bid Extractor
        </h1>
        <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="mt-5 text-sm text-muted-foreground/70">
          Sign in to continue
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-sm">
        <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {mode === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
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
          {message && <p className="text-sm text-blue-400/80">{message}</p>}

          {mode === "password" ? (
            <div className="space-y-3 pt-1 w-75">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In / Sign Up"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-foreground/70"
                onClick={() => setMode("magic")}
              >

              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
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
                className="w-full text-center text-xs text-muted-foreground/50 transition-colors duration-200 hover:text-foreground/70"
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
