import { Account } from "./accounts";

export enum CampaignStepType {
  CONNECTION_REQUEST,
  FOLLOW_UP,
}

export enum CampaignState {
  RUNNING,
  PAUSED,
  STOPPED,
  COMPLETED,
}

export type TCampaignConnectionRequest = {
  message?: string;
  delay?: string;
};

export type TCampaignFollowUp = {
  message: string;
  delay: string;
};

export type CampaignStep = {
  type: CampaignStepType;
  data: TCampaignConnectionRequest | TCampaignFollowUp;
};

export type CampaignWorkflow = {
  steps: CampaignStep[];
};

export interface CampaignInsights {
  connectionRequestsSent: number;
  connectionRequestsAccepted: number;
  messagesSent: number;
  responses: number;
}

export type OperationalTimes = {
  startTime: number;
  endTime: number;
}

export interface Lead {
  firstName: string;
  status: string;
  lastActivity: number; // epochms
  accountId: string;
  url: string;
}

export interface CampaignConfig {
  id: number;
  parentID: number;
  action: 'sendConnectionRequest' | 'sendFollowUp';
  data: {
    delay: number;
    text: string;
  };
}

export type Campaign = {
  leadListId: any;
  id?: string;
  name?: string;
  description?: string; // Backend has it, so adding it here
  createdAt?: number;
  configs?: CampaignConfig[];
  updatedAt?: number;
  state?: CampaignState; // `status` from backend
  orgID?: string;
  leads?: {
    s3Url?: string;
    fileName?: string;
    file?: File;
    data?: Lead[]; // backend data
  };
  status?: string;
  senderAccounts?: Account[]; // Not in backend, so optional
  accountIDs?: string[]; // Convert from bson.ObjectID[]
  //configs?: Config[]; // Present in backend
  operationalTimes?: OperationalTimes; // Present in backend
  workflow?: CampaignWorkflow; // Not in backend, so optional
  timezone?: string; // Not in backend, so optional
  localOperationalTimes?: {
    startTime: number;
    endTime: number;
    timezone: string;
  };
};
