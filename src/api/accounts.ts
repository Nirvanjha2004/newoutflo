import { checkUnauthorized, get } from "../common/api";
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
          if (account.convFetchedFailures && account.convFetchedFailures >= 3) {
            return {
              ...account,
              status: SyncState.INACTIVE
            };
          }
  
          // Check campaign failures
          if (account.accountActions?.campaignFailures && account.accountActions.campaignFailures >= 3) {
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
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        if (accountId) {
          // Single account request: /api/accounts/{accountId}
          const accountData = await getAccount(accountId);
          return res.status(200).json(accountData.data);
        } else {
          // All accounts request: /api/accounts
          const accountsData = await getAccounts();
          return res.status(200).json(accountsData.data);
        }
        
      case 'POST':
        // Handle account creation
        // const newAccount = await createAccount(req.body);
        // return res.status(201).json(newAccount);
        return res.status(501).json({ error: "Not implemented" });
        
      case 'PUT':
        // Handle account update
        // const updatedAccount = await updateAccount(accountId, req.body);
        // return res.status(200).json(updatedAccount);
        return res.status(501).json({ error: "Not implemented" });
        
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
