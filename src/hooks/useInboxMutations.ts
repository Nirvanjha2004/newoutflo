import { useQueryClient } from "@tanstack/react-query";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { postMessage, campaignMessage } from "../api/inbox";
import type { GenericApiResponse } from "../common/api";

export const usePostMessage = () => {
  const queryClient = useQueryClient();

  return useTanstackMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      return await postMessage(conversationId, text);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["conversations"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["messages"],
        }),
      ]);
    },
  });
};

export const useCampaignMessage = () => {
  const queryClient = useQueryClient();

  return useTanstackMutation({
    mutationFn: async ({ senderURN, url, message }: { senderURN: string, url: string, message: string }) => {
      return await campaignMessage(senderURN, url, message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["conversations"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["messages"],
        }),
      ]);
    },
  });
};

