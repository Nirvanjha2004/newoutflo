import { checkUnauthorized, GenericApiResponse, get, post } from "../common/api";
import { Account } from "../types/accounts";
import { GetConversationsResponse, GetMessagesResponse } from "../api/types/inboxTypes";
import { AnswerStatus } from "../constants/inboxConstant";

export const getConversations = async (
  _accountData: Account[],
  search: string,
  _pending: boolean,
  _cursor?: string,
  selectedAccountsIds?: string[],
  _selectedAnswerStatus?: Map<AnswerStatus, boolean>,
) => {
  const params = {
    ...(search && { searchText: search }),
    ...(selectedAccountsIds?.length && { 
      accountIDs: selectedAccountsIds.join(","), 
    }),
  };
  return await get<GetConversationsResponse, typeof params>(
    "/conversations?page=1&pageSize=300",
    params
  ).then(checkUnauthorized);
};

export const getMessages = async (conversationId: string) => {
  const params = {};
  return await get<GetMessagesResponse, typeof params>(`/conversations/${conversationId}`, params).then(
    checkUnauthorized,
  );
};

export const postMessage = async (conversationId: string, text: string) => {
  const data = {
    text: text,
  };
  return await post<GenericApiResponse, typeof data>(`/conversations/${conversationId}`, data).then(checkUnauthorized);
};

export const campaignMessage = async (senderURN: string, url: string, message: string) => {
  const data = {
    senderURN: senderURN,
    url: url,
    message: message,
  };
  return await post<GenericApiResponse, typeof data>(`/linkedin/sendNewMessage`, data).then(checkUnauthorized);
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Check if this is a LinkedIn message or a conversation
    const isLinkedInMessage = pathParts.includes('linkedin') && pathParts.includes('sendNewMessage');
    
    // Handle conversation-related requests
    if (!isLinkedInMessage) {
      // Get conversation ID if present in the URL
      const conversationIdIndex = pathParts.indexOf('conversations') + 1;
      const conversationId = conversationIdIndex < pathParts.length ? pathParts[conversationIdIndex] : null;
      
      if (method === 'GET') {
        if (!conversationId) {
          // GET /api/conversations - list all conversations
          const urlParams = url.searchParams;
          const search = urlParams.get('searchText') || '';
          const accountIDs = urlParams.get('accountIDs');
          const selectedAccountsIds = accountIDs ? accountIDs.split(',') : [];
          
          const conversationsData = await getConversations(
            [], // accountData is not used in the function
            search,
            false, // pending is not used in the function
            undefined,
            selectedAccountsIds
          );
          
          return res.status(200).json(conversationsData.data);
        } else {
          // GET /api/conversations/{conversationId} - get messages for a specific conversation
          const messagesData = await getMessages(conversationId);
          return res.status(200).json(messagesData.data);
        }
      } else if (method === 'POST' && conversationId) {
        // POST /api/conversations/{conversationId} - send a message in a conversation
        if (!req.body || !req.body.text) {
          return res.status(400).json({ error: "Missing message text" });
        }
        
        const messageResponse = await postMessage(conversationId, req.body.text);
        return res.status(201).json(messageResponse.data);
      }
    } else if (method === 'POST' && isLinkedInMessage) {
      // POST /api/linkedin/sendNewMessage - send a new LinkedIn message
      const { senderURN, url, message } = req.body;
      
      if (!senderURN || !url || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const campaignMessageResponse = await campaignMessage(senderURN, url, message);
      return res.status(201).json(campaignMessageResponse.data);
    }
    
    // If we get here, the method or path is not supported
    return res.status(405).json({ error: "Method not allowed or path not supported" });
  } catch (error) {
    console.error("Inbox API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
