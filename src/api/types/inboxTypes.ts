import { GenericApiResponse } from "../../common/api";
import { Conversation, ConversationDetail } from "../../types/inbox";

export type GetConversationsResponse = GenericApiResponse<{
  conversations: Conversation[];
}>;

export type GetMessagesResponse = GenericApiResponse<ConversationDetail>;
