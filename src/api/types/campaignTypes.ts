import { GenericApiResponse } from "../../common/api";
import { Campaign, CampaignInsights, CampaignState, Lead, CampaignConfig, AccountStatus } from "../../types/campaigns";

export type GetCampaignsResponse = GenericApiResponse<Campaign[]>;
export type GetCampaignByIdResponse = GenericApiResponse<
  Campaign & {
    leads?: {
      data?: Lead[];
    };
    configs?: CampaignConfig[];
    accountStatuses?: Record<string, AccountStatus>; // Add accountStatuses to ensure it's captured from the response
  }
>;
export type GetCampaignInsightsResponse = GenericApiResponse<CampaignInsights>;
export interface DayOperationalTime {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

export interface UpdateCampaignRequest {
  name: string;
  description: string;
  status: CampaignState | string;
  accountIDs?: string[];
  timeZone?: string;
  operationalTimes?: {
    [key: string]: DayOperationalTime | any;
    monday?: DayOperationalTime;
    tuesday?: DayOperationalTime;
    wednesday?: DayOperationalTime;
    thursday?: DayOperationalTime;
    friday?: DayOperationalTime;
    saturday?: DayOperationalTime;
    sunday?: DayOperationalTime;
    timezone?: string;
  };
  localOperationalTimes?: {
    startTime: number;
    endTime: number;
    timezone: string;
  };
}
