import { useState, useMemo } from "react";
import { Search, Star, Bell, MoreHorizontal, User, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();

  // Process accounts to get active ones
  const activeAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    // Filter for active accounts - adjust the criteria based on your data structure
    return accounts
      .filter(account => account?.status === "active" || account?.isActive)
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

  // Get accounts to display (limited or all)
  const visibleAccounts = useMemo(() => {
    return showAllAccounts ? activeAccounts : activeAccounts.slice(0, 3);
  }, [activeAccounts, showAllAccounts]);

  const toggleAccountsVisibility = () => {
    setShowAllAccounts(!showAllAccounts);
  };

  return (
    <>
      <div className="w-96 !bg-indigo-50/70 border-r border-gray-300 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                OutFlo <span className="text-[#5a41cd]">UniBox</span>
              </h2>
              <p className="text-xs text-gray-600">Your Smart Central Inbox across LinkedIn accounts</p>
            </div>
          </div>

          {/* MOVED: Active Accounts Section - now positioned above search */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-700">Connected Accounts</h3>
              <div className="flex items-center space-x-1">
                {activeAccounts.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs text-gray-500 hover:text-gray-700"
                    onClick={toggleAccountsVisibility}
                  >
                    {showAllAccounts ? (
                      <ChevronUp size={14} className="mr-1" />
                    ) : (
                      <ChevronDown size={14} className="mr-1" />
                    )}
                    {/* {showAllAccounts ? 'Less' : 'More'} */}
                  </Button>
                )}
                {/* <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <MoreHorizontal size={12} className="text-gray-400" />
                </Button> */}
              </div>
            </div>

            {accountsLoading ? (
              <div className="flex items-center h-7 space-x-2">
                <div className="w-20 h-5 bg-gray-100 animate-pulse rounded"></div>
                <div className="w-20 h-5 bg-gray-100 animate-pulse rounded"></div>
              </div>
            ) : activeAccounts.length > 0 ? (
              <div className={`flex flex-wrap gap-2 transition-all duration-200 ${showAllAccounts ? 'max-h-48' : 'max-h-10'} overflow-hidden`}>
                {visibleAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-50 border border-gray-100 transition-colors"
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
                {!showAllAccounts && activeAccounts.length > 3 && (
                  <div
                    className="flex items-center px-2 py-1 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                    onClick={toggleAccountsVisibility}
                  >
                    <span className="text-xs">+{activeAccounts.length - 3} more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 py-1">No active accounts found</div>
            )}
          </div>

          {/* Enhanced Search with Filter on the right */}

        </div>

        <div className="flex flex-col bg-indigo-50/70 pb-0 pl-3 pr-3 pt-4 rounded-lg shadow-sm border-t border-gray-300">


          <div className="flex items-center space-x-2 mb-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder="Search conversations, messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm h-9 text-sm w-full"
              />
            </div>

            {/* ConversationFilter moved to the right of search */}
            <ConversationsFilter
              activeTab={activeFilter}
              pending={isPendingFilter}
              setPending={setIsPendingFilter}
              myMessages={isMyMessagesFilter}
              setMyMessages={setIsMyMessagesFilter}
            />
          </div>

          {/* Filter tags display section */}
          <div className="mt-1 flex flex-wrap gap-1">
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
