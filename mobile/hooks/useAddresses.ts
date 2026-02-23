import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Address } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { AxiosError } from "axios";

export const useAddresses = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  const {
    data: addresses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ addresses: Address[] }>("/users/addresses");
        return data.addresses;
      } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status === 401 || error.response?.status === 404) {
          return [] as Address[];
        }
        throw error;
      }
    },
    enabled: !!isSignedIn,
    staleTime: 1000 * 60, // 1 minute
  });

  const addAddressMutation = useMutation({
    mutationFn: async (addressData: Omit<Address, "_id">) => {
      const { data } = await api.post<{ addresses: Address[] }>("/users/addresses", addressData);
      return data.addresses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Failed to add address:", error.response?.data?.message || error.message);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({
      addressId,
      addressData,
    }: {
      addressId: string;
      addressData: Partial<Address>;
    }) => {
      const { data } = await api.put<{ addresses: Address[] }>(
        `/users/addresses/${addressId}`,
        addressData
      );
      return data.addresses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Failed to update address:", error.response?.data?.message || error.message);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { data } = await api.delete<{ addresses: Address[] }>(`/users/addresses/${addressId}`);
      return data.addresses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err) => {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Failed to delete address:", error.response?.data?.message || error.message);
    },
  });

  return {
    addresses: addresses || [],
    isLoading: isLoading && !!isSignedIn,
    isError,
    addAddress: addAddressMutation.mutate,
    updateAddress: updateAddressMutation.mutate,
    deleteAddress: deleteAddressMutation.mutate,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
    addAddressError: addAddressMutation.error,
    updateAddressError: updateAddressMutation.error,
    deleteAddressError: deleteAddressMutation.error,
  };
};
