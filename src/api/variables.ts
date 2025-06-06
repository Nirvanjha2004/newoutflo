import { api } from "../common/api";
import { checkUnauthorized } from "../common/api";
import { authStore } from "./store/authStore";

export interface Variable {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  exampleValue: string;
  type: 'lead' | 'sender' | 'custom';
}

// Fetch available variables for messaging
export const getMessageVariables = async (): Promise<Variable[]> => {
  try {
    const response = await api.get('/campaigns/variables');
    return response.data.variables || [];
  } catch (error) {
    console.error("Error fetching message variables:", error);
    // Return default variables if API fails
    return [
      { id: 'first_name', name: 'First Name', description: 'Contact\'s first name', placeholder: '{first_name}', exampleValue: 'John', type: 'system' },
      { id: 'last_name', name: 'Last Name', description: 'Contact\'s last name', placeholder: '{last_name}', exampleValue: 'Smith', type: 'system' },
      { id: 'company', name: 'Company', description: 'Contact\'s company', placeholder: '{company}', exampleValue: 'Acme Inc', type: 'system' },
      { id: 'job_title', name: 'Job Title', description: 'Contact\'s job title', placeholder: '{job_title}', exampleValue: 'Marketing Director', type: 'system' }
    ];
  }
};

// Get variables specific to a campaign's lead list
export const getCampaignVariables = async (leadListId: string): Promise<Variable[]> => {
  try {
    // Get the current auth token
    const token = authStore.getState().accessToken;
    
    // Make request with explicit auth header
    const response = await api.get(`/leads/campaign-variables/${leadListId}`,{},{
        headers: {
        Authorization: `Bearer ${authStore.getState().accessToken}`
      }
    });
    
    return response.data.data?.variables || [];
  } catch (error) {
    console.error("Error fetching campaign variables:", error);
    // Return fallback variables
    return [
      { id: 'first_name', name: 'First Name', description: 'Contact\'s first name', placeholder: '{first_name}', exampleValue: 'John', type: 'lead' },
      { id: 'last_name', name: 'Last Name', description: 'Contact\'s last name', placeholder: '{last_name}', exampleValue: 'Smith', type: 'lead' },
      { id: 'company', name: 'Company', description: 'Contact\'s company', placeholder: '{company}', exampleValue: 'Acme Inc', type: 'lead' }
    ];
  }
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Only GET method is currently supported for variables
    if (method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    // Check if this is a campaign-specific variables request
    const isCampaignVariables = pathParts.includes('campaign-variables');
    
    if (isCampaignVariables) {
      // Extract the lead list ID from the URL
      const leadListIdIdx = pathParts.indexOf('campaign-variables') + 1;
      const leadListId = pathParts.length > leadListIdIdx ? pathParts[leadListIdIdx] : null;
      
      if (!leadListId) {
        return res.status(400).json({ error: "Missing lead list ID" });
      }
      
      // Extract auth token from request header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized - Missing authentication token" });
      }
      
      const campaignVariables = await getCampaignVariables(leadListId);
      return res.status(200).json({ variables: campaignVariables });
    } else {
      // General message variables request
      const messageVariables = await getMessageVariables();
      return res.status(200).json({ variables: messageVariables });
    }
  } catch (error) {
    console.error("Variables API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}