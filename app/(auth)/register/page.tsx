"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, User, Phone, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("+1 (555) 234-5678");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        password,
      });

      setUser(
        {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
          role: "customer",
          avatar_url: res.user.avatar_url,
        },
        res.access_token
      );

      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Registration failed. An account with this email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-normal text-brand-ink">
          Join Kestrel Stays
        </h2>
        <p className="text-xs text-brand-muted mt-1.5 font-light">
          Create an intentional travel account for direct sanctuary bookings.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-error-light text-error border border-error/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Legal Name"
          required
          placeholder="e.g. Clara Oswald"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="h-4 w-4 text-brand-muted" />}
        />

        <Input
          label="Email Address"
          type="email"
          required
          placeholder="clara@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4 text-brand-muted" />}
        />

        <Input
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          leftIcon={<Phone className="h-4 w-4 text-brand-muted" />}
        />

        <Input
          label="Password (min 8 characters)"
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
          {loading ? "Registering in PostgreSQL..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center text-xs text-brand-muted pt-2 border-t border-brand-border">
        Already have an account?{" "}
        <Link href="/login" className="text-pine font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

