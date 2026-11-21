"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Compass, Sparkles, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl mb-16">
        <span className="text-xs font-semibold uppercase tracking-widest text-pine">
          Our Philosophy
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-brand-ink leading-[1.1] mt-3">
          Travel as an act of attention.
        </h1>
        <p className="text-lg text-brand-muted mt-6 font-light leading-relaxed">
          Kestrel Stays was founded on a simple conviction: modern hospitality has become homogenized. We celebrate the independent hoteliers, architects, and stewards who build places with distinct soul, silence, and presence.
        </p>
      </div>

      {/* Hero Image */}
      <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-16 shadow-md bg-brand-border/30">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80"
          alt="Quiet architectural retreat"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Editorial Content Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-brand-ink font-light leading-relaxed text-sm sm:text-base mb-20">
        <div>
          <h2 className="font-serif text-2xl font-normal mb-4">
            The Anthology Standard
          </h2>
          <p className="text-brand-muted mb-4">
            We do not accept automated listings or corporate chain flags. Every sanctuary in the Kestrel collection is reviewed in person for acoustic quietude, natural daylight, architectural material honesty, and respect for its surrounding ecosystem.
          </p>
          <p className="text-brand-muted">
            Whether a restored 18th-century stone farmstead in the Scottish Highlands or a cliffside pavilion in Big Sur, these properties are destinations in their own right.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-normal mb-4">
            Direct & Fair Hospitality
          </h2>
          <p className="text-brand-muted mb-4">
            Traditional online travel agencies charge up to 25% commissions, squeezing boutique owners and forcing corners to be cut. Kestrel Stays establishes direct cryptographic booking links between guests and hosts with zero hidden markups.
          </p>
          <p className="text-brand-muted">
            Your reservation is recorded instantly in our PostgreSQL database using deterministic pricing and pessimistic inventory serialization.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 sm:p-12 rounded-2xl bg-brand-surface border border-brand-border text-center">
        <h3 className="font-serif text-3xl font-normal text-brand-ink mb-3">
          Find Your Next Sanctuary
        </h3>
        <p className="text-sm text-brand-muted max-w-xl mx-auto mb-6 font-light">
          Browse our anthology of hand-curated independent properties and reserve your stay.
        </p>
        <Link href="/search">
          <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Explore the Collection
          </Button>
        </Link>
      </div>
    </div>
  );
}
