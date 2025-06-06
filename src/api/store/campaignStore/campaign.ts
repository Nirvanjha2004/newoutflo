import { mountStoreDevtool } from "simple-zustand-devtools";
import { useStore } from "zustand";
import { create } from "zustand";

import { Campaign, CampaignState, CampaignStep, CampaignStepType, TCampaignFollowUp } from "../../../types/campaigns";
import { extractDaysAndHours } from "./utils/dateTime";
import { Account } from '@/types/accounts';

// Define the proper config structure to match your API
export interface CampaignConfig {
  id: number;
  parentID: number;
  action: "sendConnectionRequest" | "sendFollowUp";
  data: {
    delay: number;
    text: string;
  };
}

export interface ICampaignStoreState {
  currentStep: number;

  campaign: Campaign;
  createMode: boolean;
  editMode: boolean;

  campaigns: Campaign[];
}

export interface ICampaignStoreActions {
  setState: (data: Partial<ICampaignStoreState>, cb?: () => void) => void;

  init: (campaign?: Campaign) => void;
  reset: () => void;
  isCampaignStepValid: (stepIdx: number) => boolean;
  launchCampaign: () => void;
  setLeadsFile: (file: File) => void;
  setSenderAccounts: (accounts: Account[]) => void;
  setLeadsData: (leadsData: any) => void;
  setConfigs: (configs: CampaignConfig[]) => void;
  setWorkingHours: (hours: any) => void;
  setOperationalTimes: (times: any) => void; // Add this if it doesn't exist
}

const emptyCampaign: Campaign = {
  id: "",
  name: "",
  senderAccounts: [],
  leads: {
    data: [],
  },
  workflow: {
    steps: [
      {
        type: CampaignStepType.CONNECTION_REQUEST,
        data: {
          message: "",
        },
      },
      {
        type: CampaignStepType.FOLLOW_UP,
        data: {
          message: "Hi {first_name},\nThanks for connecting!",
          delay: "1days0hours",
        },
      },
    ],
  },
  state: CampaignState.RUNNING,
  timezone: "IST", // Changed default timezone from GMT to IST
};

export const campaignStore = create<ICampaignStoreState & ICampaignStoreActions>()((set, get) => ({
  currentStep: 0,
  campaign: { ...emptyCampaign },
  createMode: false,
  editMode: false,
  campaigns: [],

  setState: (data: Partial<ICampaignStoreState>, cb) => {
    set(() => data);
    cb?.();
  },

  init: (campaign) => {
    set(() => {
      return {
        campaign: campaign
          ? {
              ...campaign,
              leads: {
                ...campaign.leads,
                data: campaign.leads?.data || [],
              },
            }
          : { ...emptyCampaign },
        editMode: !!campaign,
        createMode: !campaign,
      };
    });
  },

  isCampaignStepValid: (stepIdx: number) => {
    const senderAccounts = get().campaign.senderAccounts;
    if (stepIdx === 0) {
      const leads = get().campaign.leads;
      return leads === undefined ? false : Boolean(leads.s3Url && leads.fileName);
    } else if (stepIdx === 1) {
      return senderAccounts === undefined ? false : senderAccounts.length > 0;
    } else if (stepIdx === 2) {
      // const senderAccounts = get().campaign.senderAccounts;

      const workflowSteps = get().campaign.workflow?.steps ?? [];
      return (
        (senderAccounts === undefined ? false : senderAccounts.length > 0) &&
        workflowSteps.slice(1).every((step: CampaignStep) => {
          const message = (step.data as TCampaignFollowUp).message;
          const delay = extractDaysAndHours((step.data as TCampaignFollowUp).delay);
          return 1 <= message?.length && !(delay.days === 0 && delay.hours < 3);
        })
      );
    } else if (stepIdx === 3) {
      const campaignName = get().campaign.name;
      // const senderAccounts = get().campaign.senderAccounts;
      return (senderAccounts === undefined ? false : senderAccounts.length > 0) && !!campaignName;
    }
    return false;
  },

  reset: () => {
    set(() => {
      return {
        currentStep: 0,
        campaign: { ...emptyCampaign },
        createMode: false,
        editMode: false,
      };
    });
  },

  launchCampaign: () => {
    get().campaigns.push(get().campaign);
    get().reset();
  },

  setLeadsFile: (file: File) => {
    set((state) => ({
      campaign: {
        ...state.campaign,
        leads: {
          ...state.campaign.leads,
          file: file,
          fileName: file.name,
        },
      },
    }));
  },

  setSenderAccounts: (accounts: Account[]) => {
    console.log('LinkedIn Accounts saved to campaign store:', accounts);
    set((state) => ({
      campaign: {
        ...state.campaign,
        senderAccounts: accounts,
      }
    }));
  },

  setLeadsData: (leadsData: any) => {
    console.log('Leads data saved to campaign store:', leadsData);
    set((state) => ({
      campaign: {
        ...state.campaign,
        leads: {
          ...state.campaign.leads,
          ...leadsData,
        }
      }
    }));
  },

  // Update to match API naming
  setConfigs: (configs: CampaignConfig[]) => {
    console.log('Campaign configs saved to store:', configs);
    set((state) => ({
      campaign: {
        ...state.campaign,
        configs: configs
      }
    }));
  },

  // New action for working hours
  setWorkingHours: (hours: any) => {
    console.log('Working hours saved to store:', hours);
    set((state) => ({
      campaign: {
        ...state.campaign,
        workingHours: hours
      }
    }));
  },
  
  // New action for operational times (API format)
  setOperationalTimes: (times: any) => {
    console.log('Operational times saved to store:', times);
    set((state) => ({
      campaign: {
        ...state.campaign,
        operationalTimes: times
      }
    }));
  },

}));

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("CampaignStore", campaignStore);
}

export const useCampaignStore = (p0?: (state: any) => any) => useStore(campaignStore);
