"use client";

import * as React from "react";
import Link from "next/link";
import { searchHotels, createHotel, deleteHotel } from "@/lib/api";
import { Hotel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Rating } from "@/components/ui/Rating";
import { Plus, Trash2, Edit, Building2, MapPin } from "lucide-react";

export default function AdminHotelsPage() {
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);

  // New hotel form fields
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [minPrice, setMinPrice] = React.useState(350);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await searchHotels({ page: 1, page_size: 50 });
      setHotels(res.items);
    } catch (err) {
      console.error("Failed to load hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHotels();
  }, []);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await createHotel({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        tagline,
        description: `${name} is an architectural sanctuary designed for contemplative living.`,
        property_type: "Boutique Hotel",
        star_rating: 5,
        min_price_cents: minPrice * 100,
        currency: "USD",
        location: {
          city: city || "Inverness",
          country: country || "United Kingdom",
          address: "12 Valley Road",
          postal_code: "IV1 1AA",
          latitude: 57.47,
          longitude: -4.22,
          neighborhood_description: "Scenic Highlands",
        },
        policies: {
          check_in_time: "15:00",
          check_out_time: "11:00",
          cancellation_policy_summary: "Free cancellation up to 48 hours prior to check-in.",
          free_cancellation_hours: 48,
          pet_friendly: true,
          smoking_allowed: false,
          min_age_requirement: 18,
        },
        amenities: [{ name: "Spa", icon: "spa" }, { name: "Wi-Fi", icon: "wifi" }],
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
        hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      } as any);

      setCreateOpen(false);
      setName("");
      setSlug("");
      setTagline("");
      setCity("");
      setCountry("");
      await fetchHotels();
    } catch (err: any) {
      alert(`Hotel creation failed: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property from the anthology?")) return;
    try {
      await deleteHotel(id);
      await fetchHotels();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">Hotels Catalog</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
            Manage properties, policies, and anthology publication state.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Sanctuary
        </Button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Loading hotels catalog...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surface-subtle/50 border-b border-brand-border text-brand-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Starting Rate</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-brand-surface-subtle/40">
                  <td className="py-3.5 px-4 font-medium text-brand-ink">
                    <div className="font-serif text-sm">{h.name}</div>
                    <span className="text-[11px] text-brand-muted font-mono">{h.slug}</span>
                  </td>
                  <td className="py-3.5 px-4 text-brand-muted">
                    {h.location.city}, {h.location.country}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-brand-ink">
                    ${(h.min_price_cents / 100).toFixed(0)} / night
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <Rating score={h.average_rating} size="sm" />
                      <span className="text-brand-muted">({h.review_count})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteHotel(h.id)}
                      className="p-1.5 text-brand-muted hover:text-error transition-colors cursor-pointer"
                      title="Delete property"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Hotel Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sanctuary to Anthology</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateHotel} className="space-y-4 py-4 text-sm text-brand-ink">
            <Input
              label="Hotel Name"
              required
              placeholder="The Highland Glade"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="URL Slug (Optional)"
              placeholder="the-highland-glade"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Input
              label="Tagline"
              placeholder="Sanctuary nestled in mist..."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Inverness"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="United Kingdom"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <Input
              label="Minimum Nightly Rate ($)"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Publishing to PostgreSQL..." : "Publish Sanctuary"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
