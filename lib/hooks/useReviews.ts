import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviewsForHotel, createReview, listMyReviews } from "@/lib/api";
import { CreateReviewPayload } from "@/lib/types";

export const reviewKeys = {
  all: ["reviews"] as const,
  hotel: (hotelId: string) => [...reviewKeys.all, "hotel", hotelId] as const,
  mine: () => [...reviewKeys.all, "my"] as const,
};

export function useHotelReviews(hotelId: string) {
  return useQuery({
    queryKey: reviewKeys.hotel(hotelId),
    queryFn: () => getReviewsForHotel(hotelId),
    enabled: !!hotelId,
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.mine(),
    queryFn: () => listMyReviews(),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.hotel(variables.hotel_id) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}
