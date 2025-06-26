import { api, checkUnauthorized, get, post, put } from "../common/api";
import { GenericApiResponse } from "../common/api/types";
import {
  GetCampaignByIdResponse,
  GetCampaignInsightsResponse,
  GetCampaignsResponse,
  UpdateCampaignRequest,
} from "../api/types/campaignTypes";
import { Campaign, CampaignState, CampaignStepType } from "../types/campaigns";
import { authStore } from "./store/authStore";
import { zoneMap } from "@/components/Campaign/ReviewLaunch";

export const getCampaigns = async (): Promise<GetCampaignsResponse> => {
  // Mocking

  const params = {};
  return await get<GetCampaignsResponse, typeof params>("/campaigns", params).then(checkUnauthorized);
  // return await get<GetAccountsResponse>("/accounts/").then(checkUnauthorized);
};

export const getCampaignById = async (campaignId: string): Promise<GetCampaignByIdResponse> => {
  const params = {};
  return await get<GetCampaignByIdResponse, typeof params>(`/campaigns/${campaignId}`, params)
    .then(checkUnauthorized)
    .then((response) => {
      // Log the raw response to understand the structure
      console.log("Raw campaign response:", response.data);
      
      // Make sure we preserve accountStatuses completely from the backend
      const accountStatuses = response.data.accountStatuses || {};
      
      // Log specifically the accountStatuses to check for proper naming info
      console.log("Account statuses from backend:", accountStatuses);
      
      const transformedLeads = Array.isArray(response.data.leads)
        ? response.data.leads.map((lead, index) => {
            let firstName = lead.firstName;
            if (!firstName || firstName === "N/A") {
              const url = lead.url || "";
              firstName = url === "" ? "N/A" : url;
            }

            let leadUrl = lead.url || "";
            if (leadUrl && !leadUrl.startsWith("http://") && !leadUrl.startsWith("https://")) {
              leadUrl = `https://${leadUrl}`;
            }

            // Check possible locations for accountId and assign from campaign if not found
            // prioritize explicit assignment if it exists
            const accountId =
              lead.accountID ||
              (lead.data && lead.data.accountId) ||
              (response.data.accountIDs && response.data.accountIDs.length > 0
                ? response.data.accountIDs[index % response.data.accountIDs.length]
                : undefined);

            return {
              firstName,
              status: lead.status === "active" ? "initialized" : lead.status,
              lastActivity: lead.timestamp || 0,
              accountId: accountId, // Use the determined accountId
              url: leadUrl,
            };
          })
        : [];

      return {
        ...response,
        data: {
          ...response.data,
          // Ensure accountStatuses is preserved exactly as it came from the backend
          accountStatuses: accountStatuses,
          leads: {
            data: transformedLeads,
          },
          configs: response.data.configs,
        },
      };
    });
};

export const getCampaignInsights = async (campaignId: string): Promise<GetCampaignInsightsResponse> => {
  const params = {};
  return await get<GetCampaignInsightsResponse, typeof params>(`/campaigns/insights/${campaignId}`, params).then(
    checkUnauthorized,
  );
};

// Update the convertDelayToMs function to handle minutes as well
const convertDelayToMs = (delay: string | number): number => {
  // If delay is a number, assume it's already in seconds and convert to milliseconds
  if (typeof delay === 'number') {
    return delay * 1000; // Convert seconds to milliseconds
  }
  
  // If it's a string, try to match the pattern
  if (typeof delay === 'string') {
    // First check if it's just a number as a string
    if (!isNaN(Number(delay))) {
      return Number(delay) * 1000;
    }
    
    // Try to match a pattern with days, hours, and minutes
    // This matches formats like "2days3hours15minutes" or similar variations
    const match = delay.match(/(?:(\d+)days)?(?:(\d+)hours)?(?:(\d+)minutes)?/);
    if (match) {
      const days = parseInt(match[1] || '0', 10);
      const hours = parseInt(match[2] || '0', 10);
      const minutes = parseInt(match[3] || '0', 10);
      
      const MS_PER_MINUTE = 60000;    // 1 minute = 60000 ms
      const MS_PER_HOUR = 3600000;    // 1 hour = 3600000 ms
      const MS_PER_DAY = MS_PER_HOUR * 24;
      
      return days * MS_PER_DAY + hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
    }
  }
  
  // Default value if parsing fails
  console.warn('Failed to parse delay value:', delay);
  return 0;
};
  
  // Default value if parsing fails
  console.warn('Failed to parse delay value:', delay);
  return 0;
};

export const postCampaign = async (campaignData: Campaign): Promise<GenericApiResponse> => {
  const formData = new FormData();

  // Add basic campaign info

  console.log("Posting Campaign Data:", campaignData);
  formData.append("name", campaignData.name || "test_campaign");
  formData.append("description", campaignData.description || "Test description");
  
  // Format account IDs as a JSON string array
  const accountIDs = campaignData.senderAccounts?.map((account) => account.id) || [];
  formData.append("accountIDs", JSON.stringify(accountIDs));

  // Add leadListId if it exists
  if (campaignData.leadListId) {
    formData.append("leadListId", campaignData.leadListId);
  }

  console.log("Campaign Data configs are in campaigns.ts is :", campaignData.configs);

  // Format configs in the exact structure required by backend
  if (campaignData.configs && campaignData.configs.length > 0) {
    // Ensure delay values are in milliseconds (backend expects ms, not seconds)
    const formattedConfigs = campaignData.configs.map(config => {
      // Create a deep copy to avoid mutating the original
      const formattedConfig = {
        id: config.id,
        parentID: config.parentID,
        action: config.action,
        data: { 
          delay: typeof config.data.delay === 'number' ? config.data.delay * 1000 : 0, // Convert seconds to ms
          text: config.data.text || "",
          // Include excludeConnected flag if it exists
          ...(config.data.excludeConnected !== undefined ? { excludeConnected: config.data.excludeConnected } : {})
        }
      };
      return formattedConfig;
    });
    
    // Format as JSON string exactly as shown in the image
    formData.append("configs", JSON.stringify(formattedConfigs));
    
    // console.log('Formatted configs for API:', JSON.stringify(formattedConfigs));
  } else if (campaignData.workflow?.steps) {
    // Convert from the old workflow.steps format if needed
    console.log('Converting workflow steps to configs:', campaignData.workflow.steps);
    const configsToUse = JSON.stringify(
      campaignData.workflow.steps.map((step, index) => ({
        id: index,
        parentID: index,
        action: step.type === CampaignStepType.FOLLOW_UP ? "sendFollowUp" : "sendConnectionRequest",
        data: {
          delay: step.type === CampaignStepType.FOLLOW_UP ? 
                 convertDelayToMs(step.data.delay || "") : 0,
          text: step.data.message || "",
          // Include excludeConnected flag for follow-up steps if it exists in the workflow
          ...(step.type === CampaignStepType.FOLLOW_UP && 
             campaignData.workflow?.excludeConnected !== undefined ? 
             { excludeConnected: campaignData.workflow.excludeConnected } : {})
        },
      }))
    );
    formData.append("configs", configsToUse);
  } else {
    formData.append("configs", JSON.stringify([]));
  }

  // Format operational times exactly as shown in the image
  // Note: These should be numeric hours, not seconds
  const startHour = campaignData.operationalTimes?.startTime || 3;
  const endHour = campaignData.operationalTimes?.endTime || 17;
  

  console.log("Operational Times in campaigns.ts is :", campaignData.operationalTimes);

  const operationalTimes = campaignData.operationalTimes || {
  monday: { startTime: 32400, endTime: 61200, enabled: true },
  tuesday: { startTime: 32400, endTime: 61200, enabled: true },
  wednesday: { startTime: 32400, endTime: 61200, enabled: true },
  thursday: { startTime: 32400, endTime: 61200, enabled: true },
  friday: { startTime: 32400, endTime: 61200, enabled: true },
  saturday: { startTime: 32400, endTime: 61200, enabled: false },
  sunday: { startTime: 32400, endTime: 61200, enabled: false }
};

  formData.append("operationalTimes", JSON.stringify({
    operationalTimes
  }));



  const userTimeZone = campaignData.timeZone
  const ianaZone = zoneMap[userTimeZone]
  console.log("User Time Zone:", userTimeZone , "IANA Zone:", ianaZone);
  formData.append("timeZone", ianaZone);
  

  // Add leads file if exists
  if (campaignData.leads?.file) {
    formData.append("leads_csv.csv", campaignData.leads.file);
  }

  // Debug log all form data being sent
  console.log("Campaign Data:", campaignData);
  console.log("FormData contents:");
  formData.forEach((value, key) => {
    console.log(key, value);
  });
  
  // return await post<GenericApiResponse, typeof formData>(`/campaigns`, formData).then(checkUnauthorized);
  return await api.post(`/campaigns`, formData, {
  headers: {
    authorization: authStore.getState().accessToken,
    "Content-Type": null 
    // Do NOT set Content-Type
  }
}).then(checkUnauthorized);
};

// Helper function to get timezone offset in hours
const getTimezoneOffsetHours = (timezone: string): number => {
  // Handle common timezone formats

  // Format: GMT+3, GMT-5, etc.
  const gmtMatch = timezone.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (gmtMatch) {
    const sign = gmtMatch[1] === "+" ? 1 : -1;
    const hours = parseInt(gmtMatch[2], 10);
    const minutes = gmtMatch[3] ? parseInt(gmtMatch[3], 10) / 60 : 0;
    return sign * (hours + minutes);
  }

  // Common timezone abbreviations
  const timezoneMap = {
    IST: 5.5, // Indian Standard Time (GMT+5:30)
    EST: -5, // Eastern Standard Time (GMT-5)
    PST: -8, // Pacific Standard Time (GMT-8)
    CST: -6, // Central Standard Time (GMT-6)
    MST: -7, // Mountain Standard Time (GMT-7)
    JST: 9, // Japan Standard Time (GMT+9)
    CEST: 2, // Central European Summer Time (GMT+2)
    CET: 1, // Central European Time (GMT+1)
    AEST: 10, // Australian Eastern Standard Time (GMT+10)
    ACST: 9.5, // Australian Central Standard Time (GMT+9:30)
    AWST: 8, // Australian Western Standard Time (GMT+8)
  };

  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  // Default to no offset for unrecognized formats
  return 0;
};

const mapCampaignStateToBackendStatus = (state: CampaignState): string => {

  console.log("the state recieved in mapCampaignStateToBackendStatus:", state);
  switch (state) {
    case CampaignState.MANUALPAUSED:
      return "manually_paused";
    case CampaignState.COMPLETED:
      return "success";
    case CampaignState.STOPPED:
      return "success";
    case CampaignState.PAUSED:
      return "paused";
    case CampaignState.RUNNING:
      return "active";
    default:
      return "unknown";
  }
};

export const updateCampaign = async (
  campaignId: string,
  campaignData: UpdateCampaignRequest,
): Promise<GenericApiResponse> => {
  const backendStatus = mapCampaignStateToBackendStatus(campaignData.status as CampaignState);


  console.log("Updating Campaign Data:", backendStatus);
  // Create a deep copy of the campaign data
  const updatedCampaignData = {
    ...campaignData,
    status: backendStatus,
  };

  // Convert operational times from seconds to minutes if they exist
  if (updatedCampaignData.operationalTimes) {
    const convertedTimes = { ...updatedCampaignData.operationalTimes };

    // Convert each day's times from seconds to minutes
    Object.keys(convertedTimes).forEach((day) => {
      if (day === "timezone" || typeof convertedTimes[day] !== "object") return;

      const dayData = convertedTimes[day];
      if (dayData && typeof dayData === "object") {
        if ("startTime" in dayData && typeof dayData.startTime === "number") {
          dayData.startTime = Math.floor(dayData.startTime / 60);
        }
        if ("endTime" in dayData && typeof dayData.endTime === "number") {
          dayData.endTime = Math.floor(dayData.endTime / 60);
        }
      }
    });

    updatedCampaignData.operationalTimes = convertedTimes;
  }

  console.log("Update Campaign Data:", updatedCampaignData);
  return await put<GenericApiResponse, UpdateCampaignRequest>(`/campaigns/${campaignId}`, updatedCampaignData).then(
    checkUnauthorized,
  );
};

export const refreshCampaignLeads = async (campaignId: string): Promise<GenericApiResponse> => {
  const params = {};
  return await get<GenericApiResponse, typeof params>(`/campaigns/${campaignId}/refresh-leads`, params).then(
    checkUnauthorized,
  );
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Check if we have a campaign ID or other specific endpoints in the URL
    const hasCampaignId = pathParts.length > startIdx + 1;
    const campaignId = hasCampaignId ? pathParts[startIdx + 1] : null;
    const subPath = pathParts.length > startIdx + 2 ? pathParts[startIdx + 2] : null;
    
    switch (method) {
      case 'GET':
        if (!campaignId) {
          // GET /api/campaigns - get all campaigns
          const campaignsData = await getCampaigns();
          return res.status(200).json(campaignsData.data);
        } else if (subPath === 'insights') {
          // GET /api/campaigns/insights/{campaignId}
          const insightsData = await getCampaignInsights(campaignId);
          return res.status(200).json(insightsData.data);
        } else if (subPath === 'refresh-leads') {
          // GET /api/campaigns/{campaignId}/refresh-leads
          const refreshData = await refreshCampaignLeads(campaignId);
          return res.status(200).json(refreshData.data);
        } else {
          // GET /api/campaigns/{campaignId} - get specific campaign
          const campaignData = await getCampaignById(campaignId);
          return res.status(200).json(campaignData.data);
        }
        
      case 'POST':
        // POST /api/campaigns - create a new campaign
        if (!req.body) {
          return res.status(400).json({ error: "Missing campaign data" });
        }
        
        const newCampaign = await postCampaign(req.body);
        return res.status(201).json(newCampaign.data);
        
      case 'PUT':
        // PUT /api/campaigns/{campaignId} - update a campaign
        if (!campaignId) {
          return res.status(400).json({ error: "Missing campaign ID" });
        }
        if (!req.body) {
          return res.status(400).json({ error: "Missing campaign data" });
        }
        
        const updatedCampaign = await updateCampaign(campaignId, req.body);
        return res.status(200).json(updatedCampaign.data);
        
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Campaigns API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
