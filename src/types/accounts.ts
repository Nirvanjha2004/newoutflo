import { SyncState } from '../constants/accountConstant';

export type Account = {
  isDeleted: unknown;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SyncState;
  orgId: string;
  urn: string;
  firstName: string;
  lastName: string;
  convFetchedFailures?: number;
  accountActions?: {
    dailyConnectionLimit?: number;
    weeklyConnectionLimitExceeded?: boolean;
    weeklyConnectionStopDate?: string;
    lastUpdateDate?: string;
    sendMessage?: number;
    sentInvitations?: number;
    campaignFailures?: number;
  };
  campaignFailures?: number;
  profileImageUrl?: string;
  configLimits?: {  
    maxConnectionRequestsPerDay?: number;
    maxMessagesPerDay?: number;
  };
};

export type GetAccountsResponse = {
  data: Account[];
};

export type GetAccountResponse = {
  data: Account;
};
export { SyncState };

