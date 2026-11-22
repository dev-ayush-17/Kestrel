"use client";

import * as React from "react";
import Link from "next/link";
import { getDestinations } from "@/lib/api";
import { Destination } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { MapPin, ArrowRight } from "lucide-react";

export default function DestinationsPage() {
  const [destinations, setDestinations] = React.useState<Destination[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadDestinations() {
      try {
        setLoading(true);
        const data = await getDestinations();
        setDestinations(data);
      } catch (err) {
        console.error("Failed to load destinations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-semibold uppercase tracking-widest text-pine">
          Regional Anthology
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-brand-ink mt-2">
          Curated Destinations
        </h1>
        <p className="text-base text-brand-muted mt-3 font-light leading-relaxed">
          Each destination in the Kestrel collection is chosen for its architectural resonance, natural beauty, and intentional pace of living.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm text-brand-muted mt-4">Loading regional collections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={`/search?city=${encodeURIComponent(dest.name)}`}
              className="group block rounded-xl border border-brand-border bg-brand-surface overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[16/10] relative overflow-hidden bg-brand-border/30">
                <img
                  src={dest.hero_image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-brand-ink/80 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full">
                  {dest.country}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-serif text-2xl font-normal text-brand-ink group-hover:text-pine transition-colors">
                  {dest.name}
                </h3>
                <p className="text-xs text-brand-muted mt-1 font-light italic">
                  {dest.tagline}
                </p>
                <p className="text-xs sm:text-sm text-brand-muted mt-3 line-clamp-2 leading-relaxed font-light">
                  {dest.description}
                </p>

                <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between text-xs text-brand-muted">
                  <span>{dest.hotel_count} {dest.hotel_count === 1 ? "Property" : "Properties"}</span>
                  <span className="font-medium text-pine flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Explore Stays <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

