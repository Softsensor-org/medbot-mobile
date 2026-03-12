import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/productsApi";
import type { LabelExtractionResponse } from "../types/product-label";
import type { UserProductCreate } from "../types/medical";

/**
 * Mutation hook for extracting product label data from a captured image.
 */
export function useLabelExtraction() {
  return useMutation({
    mutationFn: async (imageBase64: string): Promise<LabelExtractionResponse> => {
      return productsApi.extractLabel(imageBase64);
    },
  });
}

/**
 * Mutation hook for adding an extracted product to the user's inventory.
 */
export function useAddUserProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserProductCreate) => {
      return productsApi.addUserProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_products"] });
    },
  });
}
