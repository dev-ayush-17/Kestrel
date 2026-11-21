"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { searchHotels } from "@/lib/api";
import { Hotel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  Compass,
  Star,
  Check,
} from "lucide-react";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  const [city, setCity] = React.useState(initialCity);
  const [minRating, setMinRating] = React.useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = React.useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<string>("featured");
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchHotels = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await searchHotels({
        destination: city || undefined,
        min_rating: minRating,
        max_price_cents: maxPrice ? maxPrice * 100 : undefined,
        sort_by: sortBy === "featured" ? "recommended" : (sortBy as any),
        page: 1,
        page_size: 16,
      });
      setHotels(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load hotels:", err);
    } finally {
      setLoading(false);
    }
  }, [city, minRating, maxPrice, sortBy]);

  React.useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Controls */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-brand-ink">
            Explore Sanctuaries
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {total} {total === 1 ? "sanctuary" : "sanctuaries"} curated for intentional living
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search destination or city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-brand-muted" />}
            />
          </div>

          <select
            value={minRating || ""}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
            className="h-10 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option value="">All Ratings</option>
            <option value="4.5">★ 4.5 & up</option>
            <option value="4.8">★ 4.8 & up</option>
            <option value="4.9">★ 4.9 & up</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm text-brand-muted mt-4">Consulting live catalog...</p>
        </div>
      ) : hotels.length === 0 ? (
        <EmptyState
          title="No sanctuaries found"
          description="We couldn't find any properties matching your current criteria. Try clearing or relaxing your search terms."
          actionLabel="Clear All Filters"
          onAction={() => {
            setCity("");
            setMinRating(undefined);
            setMaxPrice(undefined);
            setSortBy("featured");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.slug}`}
              className="group block rounded-xl border border-brand-border bg-brand-surface overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[16/11] relative overflow-hidden bg-brand-border/30">
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

              <div className="p-6">
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

                <div className="mt-6 pt-4 border-t border-brand-border flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-brand-muted">From</span>
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
    </div>
  );
}


export default function SearchPage() {
  return (
    <React.Suspense fallback={<div className="py-24 flex justify-center"><Spinner size="lg" /></div>}>
      <SearchPageContent />
    </React.Suspense>
  );
}
