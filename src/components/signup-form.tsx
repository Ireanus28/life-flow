"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Re-enter them to confirm.");
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't create your account. Try again.");
        setLoading(false);
        nameRef.current?.focus();
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setLoading(false);
      if (!loginRes.ok) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-zinc-500">Start free. No credit card required.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-3">
        <div>
          <label htmlFor="signup-name" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Name
          </label>
          <input
            ref={nameRef}
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="signup-password"
              name="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-accent dark:border-zinc-800 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            name="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-500">
          {error}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
