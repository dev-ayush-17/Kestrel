"use client";

import * as React from "react";
import { searchHotels, getRoomsForHotel, updateRoom } from "@/lib/api";
import { Hotel, RoomType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { BedDouble, Users, Save, Check } from "lucide-react";

export default function AdminRoomsPage() {
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = React.useState<string>("");
  const [rooms, setRooms] = React.useState<RoomType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roomsLoading, setRoomsLoading] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  // Editable room rates and inventories
  const [editValues, setEditValues] = React.useState<Record<string, { rate: number; inventory: number }>>({});

  React.useEffect(() => {
    async function loadHotels() {
      try {
        setLoading(true);
        const res = await searchHotels({ page: 1, page_size: 50 });
        setHotels(res.items);
        if (res.items.length > 0) {
          setSelectedHotelId(res.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load hotels:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHotels();
  }, []);

  React.useEffect(() => {
    if (!selectedHotelId) return;
    async function loadRooms() {
      try {
        setRoomsLoading(true);
        const data = await getRoomsForHotel(selectedHotelId);
        setRooms(data);
        const map: Record<string, { rate: number; inventory: number }> = {};
        data.forEach((r) => {
          map[r.id] = {
            rate: Math.round(r.base_nightly_rate_cents / 100),
            inventory: r.total_inventory,
          };
        });
        setEditValues(map);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      } finally {
        setRoomsLoading(false);
      }
    }
    loadRooms();
  }, [selectedHotelId]);

  const handleSaveRoom = async (roomId: string) => {
    const vals = editValues[roomId];
    if (!vals) return;
    try {
      setUpdatingId(roomId);
      await updateRoom(roomId, {
        base_nightly_rate_cents: vals.rate * 100,
        total_inventory: vals.inventory,
      });
      alert("Room rates and inventory updated in database.");
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">
            Suites & Room Inventory
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
            Adjust nightly base rates and physical suite inventory with direct database persistence.
          </p>
        </div>

        {/* Hotel Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full h-10 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30 font-medium"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.location.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || roomsLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Loading suite inventories...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 bg-brand-surface rounded-xl border border-brand-border text-brand-muted text-sm font-light">
          No suite types configured for this property yet.
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surface-subtle/50 border-b border-brand-border text-brand-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Suite Name</th>
                <th className="py-3 px-4">Configuration</th>
                <th className="py-3 px-4">Nightly Rate ($)</th>
                <th className="py-3 px-4">Physical Units</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {rooms.map((room) => {
                const vals = editValues[room.id] || {
                  rate: Math.round(room.base_nightly_rate_cents / 100),
                  inventory: room.total_inventory,
                };
                return (
                  <tr key={room.id} className="hover:bg-brand-surface-subtle/40">
                    <td className="py-3.5 px-4 font-medium text-brand-ink">
                      <div className="font-serif text-sm">{room.name}</div>
                      <span className="text-[11px] text-brand-muted font-mono">{room.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted">
                      {room.bed_count} {room.bed_type} • {room.max_occupancy} Guests • {room.size_sqm} m²
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        className="w-24 h-8 px-2 text-xs border border-brand-border rounded bg-brand-surface-subtle text-brand-ink focus:outline-none focus:ring-1 focus:ring-pine font-mono"
                        value={vals.rate}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [room.id]: { ...vals, rate: Number(e.target.value) },
                          })
                        }
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        className="w-20 h-8 px-2 text-xs border border-brand-border rounded bg-brand-surface-subtle text-brand-ink focus:outline-none focus:ring-1 focus:ring-pine font-mono"
                        value={vals.inventory}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [room.id]: { ...vals, inventory: Number(e.target.value) },
                          })
                        }
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === room.id}
                        onClick={() => handleSaveRoom(room.id)}
                        leftIcon={<Save className="h-3.5 w-3.5" />}
                      >
                        {updatingId === room.id ? "Saving..." : "Save"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
