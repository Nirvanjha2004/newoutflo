import { useQuery } from "../common/api";
import { getAccount } from "../api/accounts";
import { useAuthStore } from "../api/store/authStore";
import { getCampaignById, getCampaignInsights, getCampaigns } from "../api/campaigns";
import { Campaign, CampaignInsights, CampaignState } from "../types/campaigns";

const mapBackendStatusToFrontendState = (status: string): CampaignState => {
  //console.log(status);
  switch (status) {
    case "success":
      return CampaignState.STOPPED;
    case "paused":
    case "manually_paused":  // Add handling for manually paused
    case "auto_paused":      // Also handle potential auto-paused status
      return CampaignState.PAUSED;
    case "completed":
      return CampaignState.COMPLETED;
    default:
      return CampaignState.RUNNING;
  }
};

export const useCampaignsQuery = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const campaigns = (await getCampaigns()).data;
      if (!campaigns) return campaigns;
      return campaigns.map((campaign) => ({
        ...campaign,
        state: mapBackendStatusToFrontendState(campaign.status ?? "Running"),
      }));
    },
    options: {
      refetchInterval: 120000,
      enabled: isAuthenticated,
      refetchOnMount: true, // Add this to ensure data is fresh when component mounts
      staleTime: 0, // Set stale time to 0 to always refetch on mount
    },
  });
};

export const useCampaignByIdQuery = (id: string, p0: { enabled: boolean }) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<Campaign>({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const response = await getCampaignById(id);
      //console.log('Campaign Response in Query:', response.data);
      console.log("Campaign Response in Query:", response.data);
      return response.data;
    },
    options: {
      enabled: isAuthenticated && !!id,
    },
  });
};

export const useCampaignInsights = (campaignId: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<CampaignInsights>({
    queryKey: ["campaigns/insights", campaignId],
    queryFn: async () => (await getCampaignInsights(campaignId)).data,
    options: {
      enabled: isAuthenticated && !!campaignId,
    },
  });
};

export const mapBackendCampaignToFrontend = async (backendCampaign: any): Promise<Campaign> => {
  const campaign: Campaign = {
    id: backendCampaign.id,
    name: backendCampaign.name,
    description: backendCampaign.description ?? "",
    createdAt: backendCampaign.createdAtEpoch,
    updatedAt: backendCampaign.updatedAtEpoch,
    state: backendCampaign.status as CampaignState,
    orgID: backendCampaign.orgId,
    leads: backendCampaign.leads.data,
    senderAccounts: [], // Will be populated below
    accountIDs: backendCampaign.accountIDs?.map((id: string) => id) ?? [],
    workflow: backendCampaign.configs ?? undefined,
    localOperationalTimes: backendCampaign.localOperationalTimes ?? undefined,
    accountStatuses: backendCampaign.accountStatuses ?? {},
    leadListId: undefined,
    operationalTimes: backendCampaign.operationalTimes ?? undefined,
  };

  // Process accounts using account information from various sources
  if (campaign.accountIDs && campaign.accountIDs.length > 0) {
    try {
      const senderAccounts = await Promise.all(
        campaign.accountIDs.map(async (id: string) => {
          // Check if account exists in accountStatuses first
          if (campaign.accountStatuses && id in campaign.accountStatuses) {
            const status = campaign.accountStatuses[id];

            // Use complete info from accountStatuses for both active and deleted accounts
            return {
              id,
              firstName: status.firstName || "",
              lastName: status.lastName || "",
              email: status.email || "",
              status: status.status || "unknown",
              isDeleted: !status.exists || status.status === "deleted"
            };
          }

          // Fall back to API fetch if not in accountStatuses
          try {
            const accountResponse = await getAccount(id);
            return {
              ...accountResponse.data,
              isDeleted: false
            };
          } catch (error) {
            console.error(`Failed to fetch account ${id}:`, error);
            return {
              id,
              firstName: "Unknown",
              lastName: "Account",
              isDeleted: true
            };
          }
        }),
      );

      campaign.senderAccounts = senderAccounts;
      console.log("Sender accounts with deletion status:", senderAccounts);
    } catch (error) {
      console.error("Error processing sender accounts:", error);
      campaign.senderAccounts = [];
    }
  }

  return campaign;
};
