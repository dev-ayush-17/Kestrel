"use client";

import * as React from "react";
import Link from "next/link";
import { listFavorites, removeFavorite } from "@/lib/api";
import { Favorite } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { MapPin, Trash2, ArrowRight } from "lucide-react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await listFavorites();
      setFavorites(data);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (hotelId: string) => {
    try {
      await removeFavorite(hotelId);
      setFavorites((prev) => prev.filter((f) => f.hotel_id !== hotelId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-ink">Saved Sanctuaries</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
          Your personal anthology of bookmarked retreats and future travel plans.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Retrieving saved hotels...</p>
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          title="No saved sanctuaries yet"
          description="Explore properties and click 'Save Property' on any stay to bookmark it here."
          actionLabel="Browse Hotels"
          onAction={() => window.location.assign("/search")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] bg-brand-border/30 relative">
                  <img
                    src={fav.hotel.hero_image}
                    alt={fav.hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemove(fav.hotel_id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-brand-ink/80 text-white hover:bg-error transition-colors cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-pine" />
                    <span>{fav.hotel.location.city}, {fav.hotel.location.country}</span>
                  </div>
                  <h3 className="font-serif text-xl font-normal text-brand-ink">
                    {fav.hotel.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Rating score={fav.hotel.average_rating} size="sm" />
                    <span className="text-xs text-brand-muted">({fav.hotel.review_count})</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link href={`/hotels/${fav.hotel.slug}`}>
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    View & Reserve
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
