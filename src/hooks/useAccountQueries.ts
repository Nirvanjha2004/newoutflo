import { useQuery } from "../common/api";
import { getAccounts, getAccount } from "../api/accounts";
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