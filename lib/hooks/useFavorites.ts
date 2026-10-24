import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/api";
import { Favorite, Hotel } from "@/lib/types";

export const favoriteKeys = {
  all: ["favorites"] as const,
};

export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: () => listFavorites(),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hotel,
      isCurrentlyFavorited,
    }: {
      hotel: Hotel;
      isCurrentlyFavorited: boolean;
    }) => {
      if (isCurrentlyFavorited) {
        await removeFavorite(hotel.id);
        return { hotelId: hotel.id, action: "removed" as const };
      } else {
        const fav = await addFavorite(hotel.id);
        return { hotelId: hotel.id, action: "added" as const, favorite: fav };
      }
    },
    onMutate: async ({ hotel, isCurrentlyFavorited }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<Favorite[]>(favoriteKeys.all) || [];

      // Optimistically update
      if (isCurrentlyFavorited) {
        queryClient.setQueryData<Favorite[]>(
          favoriteKeys.all,
          previousFavorites.filter((f) => f.hotel_id !== hotel.id)
        );
      } else {
        const optimisticFav: Favorite = {
          id: `opt-${Date.now()}`,
          user_id: "demo-user-1",
          hotel_id: hotel.id,
          hotel,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Favorite[]>(favoriteKeys.all, [
          optimisticFav,
          ...previousFavorites,
        ]);
      }

      return { previousFavorites };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoriteKeys.all, context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
