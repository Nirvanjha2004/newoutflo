import { useMutation, useQueryClient } from "@tanstack/react-query";
import { del, put } from "../common/api";
import { checkUnauthorized } from "../common/api";
import { updateAccountLimits } from "../api/accounts";

interface ApiResponse {
  Status: number;
  Data: any;
  Error: string | null;
}

interface DelResponse {
  data: ApiResponse;
}

export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await del<DelResponse>(`/accounts/${accountId}`)
        .then(checkUnauthorized);
      
      if (response.data.Error) {
        throw new Error(response.data.Error);
      }
      
      return response.data.Data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
};

export const useUpdateAccountLimitsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      accountId, 
      maxConnectionRequestsPerDay, 
      maxMessagesPerDay 
    }: { 
      accountId: string; 
      maxConnectionRequestsPerDay: number; 
      maxMessagesPerDay: number; 
    }) => {
      const response = await updateAccountLimits(accountId, {
        maxConnectionRequestsPerDay,
        maxMessagesPerDay
      });
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
};