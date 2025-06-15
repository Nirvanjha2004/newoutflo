import React, { FC, useMemo, useState } from "react";
import { Filter as FilterIcon, ChevronDown, Check, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAccountsQuery } from "@/hooks/useAccountQueries";
import { useInboxStore } from "@/api/store/inboxStore";

interface ConversationsFilterProps {
  activeTab: string;
  pending: boolean;
  setPending: (value: boolean) => void;
  myMessages: boolean;
  setMyMessages: (value: boolean) => void;
}

export const ConversationsFilter: FC<ConversationsFilterProps> = ({ 
  activeTab, 
  pending, 
  setPending,
  myMessages,
  setMyMessages
}) => {
  const { data = [] } = useAccountsQuery();
  const { selectedAccounts, setState } = useInboxStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  // Filter accounts based on search term
  const filteredAccounts = useMemo(() => {
    if (!data) return [];

    return data.filter((account) => {
      if (!account) return false;

      const fullName = `${account.firstName || ""} ${account.lastName || ""}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [data, searchTerm]);

  // Extract initial letter for avatar
  const getInitial = (name: string) => {
    return name && name.trim() ? name.trim()[0].toUpperCase() : "";
  };

  // Check if any accounts are selected
  const anyAccountSelected = useMemo(() => {
    return Array.from(selectedAccounts.values()).some((isSelected) => isSelected === true);
  }, [selectedAccounts]);

  // Function to determine if account is selected
  const isAccountSelected = (accountId: string) => {
    return selectedAccounts.has(accountId) && selectedAccounts.get(accountId) === true;
  };

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    const updatedSelectedAccounts = new Map(selectedAccounts);

    // If already selected, unselect it
    if (isAccountSelected(accountId)) {
      updatedSelectedAccounts.set(accountId, false);
    } else {
      // Otherwise select it
      updatedSelectedAccounts.set(accountId, true);
    }

    setState({
      selectedAccounts: updatedSelectedAccounts,
    });
  };

  // Badge to show number of selected accounts
  const selectedCount = useMemo(() => {
    return Array.from(selectedAccounts.values()).filter(Boolean).length;
  }, [selectedAccounts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-2 relative"
        >
          <FilterIcon className="h-4 w-4 text-gray-600" />
          {selectedCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3">Filter Conversations</h4>
          
          {/* Awaiting Response Filter */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="font-medium text-gray-800 text-sm">Awaiting Response</h5>
              <p className="text-xs text-gray-500">Messages you need to reply to</p>
            </div>
            <Switch 
              checked={pending} 
              onCheckedChange={(newValue) => {
                setPending(newValue);
                // Disable the other filter if this one is turned on
                if (newValue && myMessages) {
                  setMyMessages(false);
                }
              }}
            />
          </div>
          
          {/* My Messages Filter (new) */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-800 text-sm">My Messages</h5>
              <p className="text-xs text-gray-500">Messages where you sent the last reply</p>
            </div>
            <Switch 
              checked={myMessages} 
              onCheckedChange={(newValue) => {
                setMyMessages(newValue);
                // Disable the other filter if this one is turned on
                if (newValue && pending) {
                  setPending(false);
                }
              }}
            />
          </div>
        </div>
        
        {/* Header */}
        {/* <div className="flex items-center p-3 border-b">
          <h4 className="text-sm font-semibold text-gray-900">Senders</h4>
          <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
        </div> */}

        {/* Search */}
        {/* <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 h-9 text-sm"
            />
          </div>
        </div> */}

        {/* Accounts List */}
        {/* <div className="max-h-[300px] overflow-y-auto">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => {
              if (!account.id) return null;

              const initial = getInitial(account.firstName || "");
              const displayName = `${account.firstName || ""} ${account.lastName || ""}`.trim();
              const isSelected = isAccountSelected(account.id);

              return (
                <div
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={cn(
                    "flex items-center px-3 py-2 gap-3 cursor-pointer hover:bg-gray-50",
                    isSelected && "bg-gray-50"
                  )}
                >
                  <div 
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary" 
                        : "bg-white border-gray-300"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {displayName || "Unknown"}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              No accounts found
            </div>
          )}
        </div> */}
      </PopoverContent>
    </Popover>
  );
};
