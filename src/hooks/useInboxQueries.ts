import { Dispatch, SetStateAction } from "react";

import { useQuery } from "../common/api";
import { useAccountsQuery } from "./useAccountQueries";
import { useAuthStore } from "../api/store/authStore";
import { getConversations, getMessages } from "../api/inbox";
import { useInboxStore } from "../api/store/inboxStore";
import { ConversationDetail } from "../types/inbox";

export const useConversationsQuery = (
  pending: boolean,
  search?: string,
  setSearchLoading?: Dispatch<SetStateAction<boolean>>,
) => {
  const { isAuthenticated } = useAuthStore();
  const { data: accountData } = useAccountsQuery();
  const { selectedAnswerStatus, selectedAccounts } = useInboxStore();

  const selectedAccountIds: string[] = [];
  (accountData ?? []).forEach((account) => {
    if (!selectedAccounts.has(account.id) || (selectedAccounts.has(account.id) && selectedAccounts.get(account.id))) {
      selectedAccountIds.push(account.id);
    }
  });

  return useQuery({
    queryKey: ["conversations", search, pending, accountData, selectedAccountIds, selectedAnswerStatus],
    queryFn: async ({ pageParam: cursor }) => {
      return (
        await getConversations(
          accountData ?? [],
          search ?? "",
          pending,
          cursor,
          selectedAccountIds,
          selectedAnswerStatus,
        )
      ).data.conversations;
    },
    options: {
      enabled: isAuthenticated,
      refetchInterval: 7000,
      onSuccess: () => {
        setSearchLoading?.(false);
      },
    },
  });
};

export const useMessagesQuery = (conversationId: string | undefined) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery<ConversationDetail>({
    queryKey: ["messages", conversationId],
    queryFn: async () => (await getMessages(conversationId!)).data,
    options: {
      refetchInterval: 7000,
      enabled: isAuthenticated && !!conversationId,
    },
  });
};
