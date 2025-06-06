import { useQueryClient } from "@tanstack/react-query";

import { GenericApiResponse, useMutation } from "../common/api";
import { postCampaign, updateCampaign } from "../api/campaigns";
import { Campaign } from "../types/campaigns";
import { UpdateCampaignRequest } from "../api/types/campaignTypes";

export const usePostCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<GenericApiResponse, { CampaignData: Campaign }>({
    mutationKey: ["postCampaign"],
    mutationFn: async ({ CampaignData }) => await postCampaign(CampaignData),
options: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["campaigns"],
          }),
        ]);
      },
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<GenericApiResponse, { campaignId: string; campaignData: UpdateCampaignRequest }>({
    mutationKey: ["updateCampaign"],
    mutationFn: async ({ campaignId, campaignData }) => await updateCampaign(campaignId, campaignData),
    options: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["campaigns"],
          }),
        ]);
      },
    },
  });
};
