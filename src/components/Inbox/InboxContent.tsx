
import { useState } from "react";
import { Search, Filter, Star, Bell, MoreHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConversationList } from "@/components/Inbox/ConversationList";
import { InboxFiltersDialog } from "@/components/Inbox/InboxFiltersDialog";
import { Conversation } from "@/types/inbox";

interface InboxContentProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onProfilePreview: (conversation: Conversation) => void;
}

const activeAccounts = [
  { id: 1, name: "Sarah Johnson", initials: "SJ", status: "active" },
  { id: 2, name: "Michael Chen", initials: "MC", status: "active" },
  { id: 3, name: "Dev Prashtrip", initials: "DP", status: "active" },
];

export const InboxContent = ({ selectedConversation, onSelectConversation, onProfilePreview }: InboxContentProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filters = [
    { name: "All", count: 24 },
    { name: "Favorite", count: 3 },
    { name: "Unread", count: 8 }
  ];

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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFiltersOpen(true)}
              className="border-gray-300 hover:bg-gray-50 transition-colors h-8"
            >
              <Filter size={14} />
            </Button>
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

          {/* Search Tag */}
          {searchTerm && (
            <div className="mb-3">
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
            </div>
          )}

          {/* Enhanced Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-3">
            {filters.map((filter) => (
              <Button
                key={filter.name}
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(filter.name)}
                className={`flex-1 px-3 py-1.5 rounded-md transition-all duration-200 text-xs ${
                  activeFilter === filter.name 
                    ? 'bg-white text-gray-900 shadow-sm font-medium' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {filter.name}
                {filter.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 text-xs px-1.5 py-0 h-4 ${
                      activeFilter === filter.name 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {filter.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Active Accounts Section - Horizontal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-700">Active Accounts</h3>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <MoreHorizontal size={12} className="text-gray-400" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                      {account.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-700">{account.name.split(' ')[0]}</span>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList 
          searchTerm={searchTerm}
          activeFilter={activeFilter}
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
