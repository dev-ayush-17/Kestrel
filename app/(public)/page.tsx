"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFeaturedHotels, getDestinations } from "@/lib/api";
import { Hotel, Destination } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { Spinner } from "@/components/ui/Spinner";
import {
  Compass,
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Heart,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = React.useState("");
  const [featuredHotels, setFeaturedHotels] = React.useState<Hotel[]>([]);
  const [destinations, setDestinations] = React.useState<Destination[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [hotelsData, destsData] = await Promise.all([
          getFeaturedHotels(),
          getDestinations(),
        ]);
        setFeaturedHotels(hotelsData);
        setDestinations(destsData);
      } catch (err) {
        console.error("Failed to load home page catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      router.push(`/search?city=${encodeURIComponent(city.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-brand-ink text-white overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80"
            alt="Luxury retreat"
            className="w-full h-full object-cover opacity-45 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5 text-pine-light" />
            <span>Curated Sanctuary Stays</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.08] mb-6">
            Sanctuaries for the intentional traveler.
          </h1>

          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            A hand-curated anthology of independent boutique hotels, historic mountain lodges, and secluded coastal retreats.
          </p>

          {/* Quick Search Card */}
          <form
            onSubmit={handleSearch}
            className="p-3 sm:p-4 rounded-xl bg-brand-surface/95 backdrop-blur-md border border-white/10 shadow-xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-brand-ink"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-3 py-2 bg-brand-surface-subtle rounded-lg border border-brand-border">
              <MapPin className="h-5 w-5 text-pine shrink-0" />
              <input
                type="text"
                placeholder="Where would you like to escape?"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto shrink-0"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Search Stays
            </Button>
          </form>
        </div>
      </section>

      {/* Featured Sanctuaries Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-pine">
              Selected Collection
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-brand-ink mt-2">
              Featured Sanctuaries
            </h2>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:text-pine-hover transition-colors"
          >
            <span>View All Properties</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-sm text-brand-muted mt-3">Loading curated sanctuaries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.slug}`}
                className="group rounded-xl border border-brand-border bg-brand-surface overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[16/11] relative overflow-hidden bg-brand-border/40">
                  <img
                    src={hotel.hero_image}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 right-3 bg-brand-ink/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Rating score={hotel.average_rating} size="sm" />
                    <span className="ml-0.5">({hotel.review_count})</span>
                  </div>
                  {hotel.featured && (
                    <div className="absolute top-3 left-3 bg-pine text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Anthology Choice
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-2">
                      <MapPin className="h-3.5 w-3.5 text-pine shrink-0" />
                      <span>
                        {hotel.location.city}, {hotel.location.country}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-normal text-brand-ink group-hover:text-pine transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {hotel.tagline}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-brand-border flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-brand-muted">
                      From
                    </span>
                    <span className="font-serif text-xl font-medium text-brand-ink">
                      ${(hotel.min_price_cents / 100).toFixed(0)}{" "}
                      <span className="text-xs font-sans text-brand-muted font-normal">/ night</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Curated Destinations Section */}
      <section className="py-20 bg-brand-surface border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-pine">
              Destinations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-brand-ink mt-2">
              Explore by Region
            </h2>
            <p className="text-sm text-brand-muted mt-3">
              From alpine silence to warm coastal waters, choose your climate and pace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/search?city=${encodeURIComponent(dest.name)}`}
                className="group relative h-80 rounded-xl overflow-hidden block shadow-xs"
              >
                <img
                  src={dest.hero_image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                    {dest.country}
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-white mt-1">
                    {dest.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-xs text-white/80">
                    <span>{dest.hotel_count} {dest.hotel_count === 1 ? "Sanctuary" : "Sanctuaries"}</span>
                    <span>Best: {dest.best_season}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Pillars Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 rounded-xl border border-brand-border bg-brand-surface">
            <div className="h-12 w-12 rounded-lg bg-pine/10 text-pine flex items-center justify-center mb-6">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-brand-ink mb-3">
              Architectural Distinction
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              Every property is vetted for architectural intention, heritage preservation, and harmonious integration into its landscape.
            </p>
          </div>

          <div className="p-8 rounded-xl border border-brand-border bg-brand-surface">
            <div className="h-12 w-12 rounded-lg bg-pine/10 text-pine flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-brand-ink mb-3">
              Guaranteed Direct Reservations
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              Zero middleman commissions. Instant booking confirmation powered by pessimistic database serialization and deterministic rates.
            </p>
          </div>

          <div className="p-8 rounded-xl border border-brand-border bg-brand-surface">
            <div className="h-12 w-12 rounded-lg bg-pine/10 text-pine flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-brand-ink mb-3">
              Dedicated Concierge
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              Personalized itineraries, dining reservations, and seamless date modifications arranged directly with property hosts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
