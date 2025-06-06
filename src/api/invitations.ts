import { checkUnauthorized, get } from "../common/api";
import { GetInvitationsResponse } from "../api/types/invitationsTypes";

export const getInvitations = async (search: string, cursor?: string) => {
  const params = {
    cursor,
    ...(search.length > 0 ? { search_str: search } : {}),
  };
  return await get<GetInvitationsResponse, typeof params>("/platforms/invitations/", params).then(checkUnauthorized);
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    // Only GET method is currently supported for invitations
    if (method === 'GET') {
      // Extract query parameters
      const urlParams = url.searchParams;
      const search = urlParams.get('search_str') || '';
      const cursor = urlParams.get('cursor') || undefined;
      
      // Get invitations with optional filtering
      const invitationsData = await getInvitations(search, cursor);
      return res.status(200).json(invitationsData.data);
    } else {
      // Method not allowed for this endpoint
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Invitations API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
