import { checkUnauthorized, get, put } from "../common/api";
import { GetAccountsResponse, GetAccountResponse } from "../api/types/accountTypes";
import { SyncState } from "../constants/accountConstant";

export const getAccounts = async () => {
  return await get<GetAccountsResponse>("/accounts")
    .then(checkUnauthorized)
    .then(response => {
      if (response && response.data) {
        const updatedAccounts = response.data.map(account => {
          // If already inactive, return as is
          if (account.status === 'inactive') {
            return account;
          }
  
          // Check conversation fetch failures
          if (account.convFetchedFailures && account.convFetchedFailures >= 15) {
            return {
              ...account,
              status: SyncState.INACTIVE
            };
          }
  
          // Check campaign failures
          if (account.accountActions?.campaignFailures && account.accountActions.campaignFailures >= 8) {
            return {
              ...account,
              status: SyncState.INACTIVE
            };
          }
  
          return account;
        });
  
        return {
          ...response,
          data: updatedAccounts
        };
      }

      console.log("The response from getAccounts is ", response);
      return response;
    });
};

export const getAccount = async (accountId: string) => {
  return await get<GetAccountResponse>(`/accounts/${accountId}`)
    .then(checkUnauthorized)
    .then(response => {
      const account = response.data;
      // If already inactive, return as is
      if (account.status === 'inactive') return response;

      // Check conversation fetch failures
      if (account.convFetchedFailures && account.convFetchedFailures >= 3) {
        return {
          ...response,
          data: {
            ...account,
            status: SyncState.INACTIVE
          }
        };
      }

      // Check campaign failures
      if (account.campaignFailures && account.campaignFailures >= 3) {
        return {
          ...response,
          data: {
            ...account,
            status: SyncState.INACTIVE
          }
        };
      }

      return response;
    });
};

export const updateAccountLimits = async (accountId: string, limits: {
  maxConnectionRequestsPerDay: number;
  maxMessagesPerDay: number;
}) => {
  return await put<any>(`/accounts/config/${accountId}`, {
    maxConnectionRequestsPerDay: limits.maxConnectionRequestsPerDay, 
    maxMessagesPerDay: limits.maxMessagesPerDay
  }).then(checkUnauthorized);
};

// Add this new function to get account configuration
export const getAccountConfig = async (accountId: string) => {
  return await get<any>(`/accounts/config/${accountId}`)
    .then(checkUnauthorized);
};

// Add other account-related functions here (updateAccount, deleteAccount, etc.)

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Check if we have an account ID in the URL
    const accountId = pathParts.length > startIdx + 1 ? pathParts[startIdx + 1] : null;
    
    // Check if this is a config endpoint
    const isConfigEndpoint = pathParts.length > startIdx + 2 && pathParts[startIdx + 2] === 'config';
    
    // Check if this is a limits endpoint
    const isLimitsEndpoint = pathParts.length > startIdx + 2 && pathParts[startIdx + 2] === 'limits';
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        if (accountId && isConfigEndpoint) {
          // GET /accounts/config/{accountId}
          try {
            // In a real implementation, you would fetch this from your database
            const accountConfig = await getAccountConfigFromDatabase(accountId);
            
            return res.status(200).json({
              maxConnectionRequestsPerDay: accountConfig.maxConnectionRequestsPerDay || 25,
              maxMessagesPerDay: accountConfig.maxMessagesPerDay || 50
            });
          } catch (error) {
            console.error("Error fetching account config:", error);
            return res.status(500).json({ error: "Failed to fetch account configuration" });
          }
        } else if (accountId) {
          // Single account request: /api/accounts/{accountId}
          const accountData = await getAccount(accountId);
          return res.status(200).json(accountData.data);
        } else {
          // All accounts request: /api/accounts
          const accountsData = await getAccounts();
          return res.status(200).json(accountsData.data);
        }
        break;
      
      case 'POST':
        // Handle account creation
        // const newAccount = await createAccount(req.body);
        // return res.status(201).json(newAccount);
        return res.status(501).json({ error: "Not implemented" });
        
      case 'PUT':
        if (accountId && isLimitsEndpoint) {
          // Handle updating account limits: /api/accounts/{accountId}/limits
          const { maxConnectionRequestsPerDay, maxMessagesPerDay } = req.body;
          
          // Validate inputs
          if (maxConnectionRequestsPerDay === undefined || maxMessagesPerDay === undefined) {
            return res.status(400).json({ 
              error: "Missing required parameters: maxConnectionRequestsPerDay or maxMessagesPerDay" 
            });
          }
          
          // Validate that values are numbers
          if (isNaN(maxConnectionRequestsPerDay) || isNaN(maxMessagesPerDay)) {
            return res.status(400).json({ 
              error: "Invalid values: maxConnectionRequestsPerDay and maxMessagesPerDay must be numbers" 
            });
          }
          
          try {
            // Update account limits in the database
            // This is a placeholder - implement your database update logic here
            const updatedAccount = await updateAccountInDatabase(accountId, {
              maxConnectionRequestsPerDay: parseInt(maxConnectionRequestsPerDay),
              maxMessagesPerDay: parseInt(maxMessagesPerDay)
            });
            
            return res.status(200).json({
              success: true,
              accountId,
              limits: {
                maxConnectionRequestsPerDay: parseInt(maxConnectionRequestsPerDay),
                maxMessagesPerDay: parseInt(maxMessagesPerDay)
              }
            });
          } catch (error) {
            console.error("Error updating account limits:", error);
            return res.status(500).json({ error: "Failed to update account limits" });
          }
        } else if (accountId) {
          // Handle other account updates
          // Implement your account update logic here
          return res.status(501).json({ error: "Account update not implemented" });
        } else {
          return res.status(400).json({ error: "Missing account ID" });
        }
        
      case 'DELETE':
        // Handle account deletion
        // await deleteAccount(accountId);
        // return res.status(204).send();
        return res.status(501).json({ error: "Not implemented" });
        
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Account API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// Helper function to update account in database (implementation would depend on your database)
async function updateAccountInDatabase(accountId, data) {
  // This is a placeholder - implement your database logic here
  // Example: return await db.accounts.update({ id: accountId }, { $set: data });
  
  // For now, just return the data that would be updated
  return {
    id: accountId,
    ...data
  };
}

// Helper function to get account config from database
async function getAccountConfigFromDatabase(accountId) {
  // This is a placeholder - implement your database logic here
  // Example: return await db.accountConfigs.findOne({ accountId });
  
  // For now, return mock data
  return {
    maxConnectionRequestsPerDay: 25,
    maxMessagesPerDay: 50
  };
}
