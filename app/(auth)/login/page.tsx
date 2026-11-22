"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, ArrowRight, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = React.useState("clara.oswald@example.com");
  const [password, setPassword] = React.useState("password123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await login({ email, password });
      setUser(
        {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
          role: res.user.role as any,
          avatar_url: res.user.avatar_url,
        },
        res.access_token
      );

      if (res.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: "customer" | "admin") => {
    if (role === "customer") {
      setEmail("clara.oswald@example.com");
      setPassword("password123");
    } else {
      setEmail("admin@kestrelstays.com");
      setPassword("admin123");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-normal text-brand-ink">
          Welcome to Kestrel
        </h2>
        <p className="text-xs text-brand-muted mt-1.5 font-light">
          Sign in to manage your reservations and sanctuary stays.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-error-light text-error border border-error/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4 text-brand-muted" />}
        />

        <Input
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4 text-brand-muted" />}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {loading ? "Authenticating via FastAPI..." : "Sign In to Kestrel"}
        </Button>
      </form>

      {/* Quick Demo Account Logins */}
      <div className="pt-4 border-t border-brand-border">
        <div className="text-[11px] uppercase tracking-wider text-center text-brand-muted font-semibold mb-3">
          Quick Demo Credentials
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin("customer")}
            leftIcon={<UserCheck className="h-3.5 w-3.5" />}
          >
            Clara (Guest)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin("admin")}
            leftIcon={<Shield className="h-3.5 w-3.5" />}
          >
            Alexander (Admin)
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-brand-muted pt-2">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="text-pine font-medium hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

