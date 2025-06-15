import { useQuery } from "../common/api";
import { getAccounts, getAccount, getAccountConfig } from "../api/accounts";
import { Account } from "../types/accounts";
import { useAuthStore } from "../api/store/authStore";

export const useAccountsQuery = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => (await getAccounts()).data,
    options: {
      refetchInterval: 120000,
      enabled: isAuthenticated,
    },
  });
};

export const useAccountQuery = (accountId: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<Account>({
    queryKey: ["accounts", accountId],
    queryFn: async () => (await getAccount(accountId)).data,
    options: {
      enabled: isAuthenticated,
    },
  });
};

// Add this new query hook
export const useAccountConfigQuery = (accountId: string | undefined) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<{
    maxConnectionRequestsPerDay: number;
    maxMessagesPerDay: number;
  }>({
    queryKey: ["accounts", accountId, "config"],
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID is required");
      const response = await getAccountConfig(accountId);
      return response.data;
    },
    options: {
      enabled: isAuthenticated && Boolean(accountId),
      // Don't refetch too often since limits aren't changed frequently
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  });
};