import { api } from "../common/api";
import { checkUnauthorized } from "../common/api";
import { authStore } from "../api/store/authStore"; // Import your auth store

// Adjust these URLs to match your actual backend endpoints
const MAPPING_SUGGESTIONS_URL = '/leads/mapping-suggestions';
const PROCESS_LEADS_URL = '/campaigns/process-leads';

// Get mapping suggestions from backend
export const getMappingSuggestions = async (file: File) => {
  const formData = new FormData();
  formData.append("csv_file", file);
  
  try {
    // Send auth token but don't use checkUnauthorized
    return await api.post(MAPPING_SUGGESTIONS_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authStore.getState().accessToken}`
      }
    });
  } catch (error) {
    // Log error but don't logout user
    console.error("Error getting mapping suggestions:", error);
    throw error;
  }
};

// Process leads with final mapping
export const processLeadsWithMapping = async (file: File, mappingInfo: any) => {
  const formData = new FormData();
  formData.append("csv_file", file);
  formData.append("mappings", JSON.stringify(mappingInfo));
  
  try {
    // Send auth token but don't use checkUnauthorized
    return await api.post(PROCESS_LEADS_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authStore.getState().accessToken}`
      }
    });
  } catch (error) {
    // Log error but don't logout user
    console.error("Error processing leads:", error);
    throw error;
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
    
    // Only POST method is supported for leads operations
    if (method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    // Extract the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized - Missing authentication token" });
    }
    
    // Check if this is a mapping suggestions or process leads request
    const isMappingSuggestions = pathParts.includes('mapping-suggestions');
    const isProcessLeads = pathParts.includes('process-leads');
    
    if (isMappingSuggestions) {
      // Handle mapping suggestions request
      if (!req.files || !req.files.csv_file) {
        return res.status(400).json({ error: "Missing CSV file" });
      }
      
      const file = req.files.csv_file;
      const response = await getMappingSuggestions(file);
      return res.status(200).json(response.data);
    } else if (isProcessLeads) {
      // Handle process leads request
      if (!req.files || !req.files.csv_file) {
        return res.status(400).json({ error: "Missing CSV file" });
      }
      
      if (!req.body.mappings) {
        return res.status(400).json({ error: "Missing mappings information" });
      }
      
      const file = req.files.csv_file;
      const mappingInfo = JSON.parse(req.body.mappings);
      
      const response = await processLeadsWithMapping(file, mappingInfo);
      return res.status(200).json(response.data);
    } else {
      return res.status(404).json({ error: "Endpoint not found" });
    }
  } catch (error) {
    console.error("Leads API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
