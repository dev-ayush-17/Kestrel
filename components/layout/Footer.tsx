"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const Footer: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-brand-border bg-brand-surface text-brand-ink pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Promise Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 mb-12 border-b border-brand-border/60">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-md bg-pine-light text-pine shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-brand-ink">
                Authentic Character
              </h4>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Hand-picked boutique sanctuaries, historic lodges, and architectural coastal stays.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-md bg-pine-light text-pine shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-brand-ink">
                Guaranteed Reservations
              </h4>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Direct hotel inventory integration with verified zero-oversell booking guarantees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-md bg-pine-light text-pine shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-brand-ink">
                Dedicated Concierge
              </h4>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                24/7 guest assistance, complimentary itinerary planning, and transparent cancellation terms.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-brand-border/60">
          {/* Brand Column & Newsletter */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-7 w-7 rounded-md bg-pine flex items-center justify-center text-white">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-serif text-xl tracking-tight text-brand-ink">
                Kestrel Stays
              </span>
            </Link>
            <p className="text-xs text-brand-muted leading-relaxed max-w-sm mb-6">
              An anthology of characterful independent sanctuaries, boutique hotels, and serene retreats curated for intentional travelers.
            </p>

            <div className="max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink mb-2">
                Receive Dispatch & Private Releases
              </p>
              {subscribed ? (
                <p className="text-xs text-success font-medium bg-success-light p-2.5 rounded-md border border-success/20">
                  Thank you. You are enrolled in the Kestrel Private Dispatch.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-brand-border bg-brand-surface-subtle focus:outline-none focus:border-pine"
                  />
                  <Button type="submit" variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Join
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-ink mb-4">
              Destinations
            </h4>
            <ul className="space-y-2.5 text-xs text-brand-muted">
              <li>
                <Link href="/destinations/kyoto" className="hover:text-pine transition-colors">
                  Kyoto, Japan
                </Link>
              </li>
              <li>
                <Link href="/destinations/highlands" className="hover:text-pine transition-colors">
                  Scottish Highlands
                </Link>
              </li>
              <li>
                <Link href="/destinations/big-sur" className="hover:text-pine transition-colors">
                  Big Sur, California
                </Link>
              </li>
              <li>
                <Link href="/destinations/amalfi" className="hover:text-pine transition-colors">
                  Amalfi Coast, Italy
                </Link>
              </li>
              <li>
                <Link href="/destinations/santorini" className="hover:text-pine transition-colors">
                  Santorini, Greece
                </Link>
              </li>
            </ul>
          </div>

          {/* Stays & Collections */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-ink mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-brand-muted">
              <li>
                <Link href="/search?type=boutique" className="hover:text-pine transition-colors">
                  Boutique City Inhabits
                </Link>
              </li>
              <li>
                <Link href="/search?type=lodge" className="hover:text-pine transition-colors">
                  Mountain Timber Lodges
                </Link>
              </li>
              <li>
                <Link href="/search?type=beachfront" className="hover:text-pine transition-colors">
                  Beachfront Havens
                </Link>
              </li>
              <li>
                <Link href="/search?type=resort" className="hover:text-pine transition-colors">
                  Thermal Wellness Resorts
                </Link>
              </li>
              <li>
                <Link href="/styleguide" className="hover:text-pine transition-colors font-medium text-pine">
                  UI Styleguide
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-ink mb-4">
              Hospitality
            </h4>
            <ul className="space-y-2.5 text-xs text-brand-muted">
              <li>
                <Link href="/about" className="hover:text-pine transition-colors">
                  Our Philosophy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-pine transition-colors">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-pine transition-colors">
                  Guest FAQs
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-pine transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-pine transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-pine transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-brand-subtle gap-4">
          <p>© 2026 Kestrel Stays Inc. All rights reserved.</p>
          <p className="text-center md:text-right">
            Architected for clean decoupling with FastAPI + PostgreSQL backend.
          </p>
        </div>
      </div>
    </footer>
  );
};
