import { useState, useMemo } from "react";
import { Search, Star, Bell, MoreHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConversationList } from "@/components/Inbox/ConversationList";
import { InboxFiltersDialog } from "@/components/Inbox/InboxFiltersDialog";
import { Conversation } from "@/types/inbox";
import { ConversationsFilter } from "@/components/ConversationFilter";
import { useAccountsQuery } from "@/hooks/useAccountQueries";

interface InboxContentProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onProfilePreview: (conversation: Conversation) => void;
}

export const InboxContent = ({ selectedConversation, onSelectConversation, onProfilePreview }: InboxContentProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isPendingFilter, setIsPendingFilter] = useState(false);
  const [isMyMessagesFilter, setIsMyMessagesFilter] = useState(false);
  
  // Fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();
  
  // Process accounts to get active ones
  const activeAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
    
    // Filter for active accounts - adjust the criteria based on your data structure
    return accounts
      .filter(account => account?.status === "active" || account?.isActive)
      .slice(0, 5) // Limit to 5 active accounts to avoid overcrowding
      .map(account => {
        const firstName = account?.firstName || '';
        const lastName = account?.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || account?.email?.split('@')[0] || 'User';
        
        // Get initials from name
        const initials = name
          .split(' ')
          .map(part => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
          
        return {
          id: account?.id,
          name,
          initials,
          status: account?.status || "active",
          profileImage: account?.profilePicture || account?.avatar
        };
      });
  }, [accounts]);

  return (
    <>
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Inbox</h1>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Bell size={12} className="text-orange-500" />
                  <p className="text-xs text-orange-600 font-medium">Free trial ends in 7 days</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5">
                  Upgrade
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ConversationsFilter 
                activeTab={activeFilter}
                pending={isPendingFilter}
                setPending={setIsPendingFilter}
                myMessages={isMyMessagesFilter}
                setMyMessages={setIsMyMessagesFilter}
              />
            </div>
          </div>

          {/* Enhanced Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <Input
              placeholder="Search conversations, messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm h-9 text-sm"
            />
          </div>

          {/* Filter tags display section */}
          <div className="mb-3 flex flex-wrap gap-2">
            {/* Search Tag */}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                <Search size={10} className="mr-1" />
                "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm("")}
                  className="ml-1 text-blue-400 hover:text-blue-600 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Pending Filter Tag */}
            {isPendingFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                <Bell size={10} className="mr-1" />
                Awaiting Response
                <button 
                  onClick={() => setIsPendingFilter(false)}
                  className="ml-1 text-amber-800 hover:text-amber-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Active Accounts Section with real data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-700">Active Accounts</h3>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <MoreHorizontal size={12} className="text-gray-400" />
              </Button>
            </div>
            
            {accountsLoading ? (
              <div className="flex items-center h-7 space-x-2">
                <div className="w-20 h-5 bg-gray-100 animate-pulse rounded"></div>
                <div className="w-20 h-5 bg-gray-100 animate-pulse rounded"></div>
              </div>
            ) : activeAccounts.length > 0 ? (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                {activeAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    <Avatar className="w-5 h-5">
                      {account.profileImage ? (
                        <img src={account.profileImage} alt={account.name} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                          {account.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs text-gray-700">{account.name.split(' ')[0]}</span>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 py-1">No active accounts found</div>
            )}
          </div>
        </div>

        {/* Conversation List - Update props to include new filters */}
        <ConversationList 
          searchTerm={searchTerm}
          activeFilter={activeFilter}
          isPendingFilter={isPendingFilter}
          isMyMessagesFilter={isMyMessagesFilter}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
        />
      </div>

      <InboxFiltersDialog 
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
      />
    </>
  );
};
