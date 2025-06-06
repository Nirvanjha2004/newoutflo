import { useMutation, useQueryClient } from "@tanstack/react-query";
import { del } from "../common/api";
import { checkUnauthorized } from "../common/api";

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