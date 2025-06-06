import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/types/inbox";
import { useConversationsQuery } from "@/hooks/useInboxQueries";
import { useAccountsQuery } from "@/hooks/useAccountQueries";
import { useMemo } from "react";

interface ConversationListProps {
  searchTerm: string;
  activeFilter: string;
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList = ({ 
  searchTerm, 
  activeFilter, 
  selectedConversation, 
  onSelectConversation 
}: ConversationListProps) => {
  // Fetch conversations based on search term
  const { data: conversations = [], isLoading: loading, error } = useConversationsQuery(
    false, 
    searchTerm
  );
  
  // Fetch accounts to identify which account is primary
  const { data: accounts = [] } = useAccountsQuery();

  // Filter conversations based on active filter
  const filteredConversations = conversations.filter(conv => {
    if (activeFilter === "Unread") return true; // Add unread logic when available
    if (activeFilter === "Favorite") return true; // Add favorite logic when available
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-red-500">Error loading conversations</div>
      </div>
    );
  }

  if (searchTerm && filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg border border-gray-200">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500 mb-6">No conversations match your search criteria</p>
        <Button 
          variant="default" 
          onClick={() => {/* Clear search logic */}}
          className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.map((conversation) => {
        // Find the account URN that belongs to our user
        const primaryAccountUrn = accounts.length > 0 ? accounts[0].urn : null;
        
        // Find the contact account (the one that's not our primary account)
        const contactAccount = conversation.accounts.find(acc => acc.urn !== primaryAccountUrn) || conversation.accounts[0];
        
        // Get names for display
        const contactName = `${contactAccount.firstName || ''} ${contactAccount.lastName || ''}`.trim();
        const contactInitials = `${(contactAccount.firstName?.[0] || '')}${(contactAccount.lastName?.[0] || '')}`.toUpperCase();
        
        // Get primary account for sender display (our user's name)
        const primaryAccount = accounts.find(acc => acc.urn === primaryAccountUrn) || {
          firstName: "Your",
          lastName: "Account"
        };
        const primaryAccountName = `${primaryAccount.firstName || ''} ${primaryAccount.lastName || ''}`.trim();
        
        // Determine if the last message was sent by our user
        const lastMessageSentByUser = conversation.lastMessage && 
          conversation.lastMessage.senderURN === primaryAccountUrn;
        
        // Format date properly
        const lastActivityTime = conversation.lastActivityAtEpoch || conversation.lastActivityAt;
        let formattedDate = "Invalid Date";
        
        if (lastActivityTime) {
          // Convert to number if it's a string
          const timestamp = typeof lastActivityTime === 'string' ? parseInt(lastActivityTime) : lastActivityTime;
          const date = new Date(timestamp);
          
          // Check if date is today
          const isToday = new Date().toDateString() === date.toDateString();
          if (isToday) {
            formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
        }
        
        // Determine unread status (just placeholder logic for now)
        const hasUnread = conversation.id.charCodeAt(0) % 3 === 0; // Just for demonstration
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
              selectedConversation?.id === conversation.id 
                ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                : 'hover:shadow-sm'
            }`}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12 ring-2 ring-gray-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {contactInitials || '??'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 truncate text-sm">{contactName || 'Unknown Contact'}</h4>
                  {hasUnread && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-sm">
                      1
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 truncate mb-2 font-medium">
                  LinkedIn Connection
                </p>
                
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700 truncate flex-1 font-medium">
                    {conversation.lastMessage?.text || "No messages"}
                  </p>
                  <span className="text-xs text-gray-400 ml-2 font-medium">
                    {formattedDate}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Avatar className="w-4 h-4 mr-2">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {primaryAccount.firstName?.[0] || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500 font-medium">
                    {lastMessageSentByUser ? primaryAccountName : contactName}
                  </span>
                  <div className="w-1 h-1 bg-blue-500 rounded-full ml-2"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
