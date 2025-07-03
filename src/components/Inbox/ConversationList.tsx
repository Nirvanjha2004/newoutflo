import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conversation, Account } from "@/types/inbox"; // Ensure Account is imported if used directly
import { useConversationsQuery } from "@/hooks/useInboxQueries";
import { useAccountsQuery } from "@/hooks/useAccountQueries";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { BadgeCheck, ChevronDown, Plus } from "lucide-react"; // If using lucide-react


interface ConversationListProps {
  searchTerm: string;
  activeFilter: string;
  isPendingFilter: boolean;
  isMyMessagesFilter: boolean;
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

// --- PLACEHOLDER HELPER FUNCTIONS ---
// Ensure your actual `getAccount` and `getAccountByUrn` functions are implemented and available in this scope.
// The `getAccount` function is crucial and should match the behavior described in your prompt.
// `accountsData` here refers to the list of the app user's own accounts.
const getAccountPlaceholder = (
  conversation: Conversation,
  type: "account" | "connection",
  accountsData: Account[], // App user's own accounts
  hint?: any
): (Partial<Account> & { sentBy?: any }) | undefined => {
  if (!conversation || !conversation.accounts || conversation.accounts.length === 0) return undefined;

  if (type === "account") {
    // Attempt to find which of the app user's accounts is in this conversation
    const userAccountInConversation = conversation.accounts.find(convAcc =>
      accountsData.some(appAcc => appAcc.urn === convAcc.urn)
    );
    if (userAccountInConversation) {
      // Simplistic hint: index of this account in conversation.accountURNs or a default
      const sentByHint = conversation.accountURNs?.indexOf(userAccountInConversation.urn);
      return { ...userAccountInConversation, sentBy: sentByHint !== -1 ? sentByHint : 0 };
    }
    // Fallback: if no direct match, this placeholder returns undefined.
    // Your actual function should be more robust.
    return undefined;
  }

  if (type === "connection") {
    // Attempt to find the account that is NOT one of the app user's accounts
    const connectionAccount = conversation.accounts.find(convAcc =>
      !accountsData.some(appAcc => appAcc.urn === convAcc.urn)
    );
    if (connectionAccount) return connectionAccount;

    // Fallback based on hint (if hint is an index, for example)
    // This part of placeholder is very naive.
    if (hint !== undefined && typeof hint === 'number' && conversation.accounts[hint === 0 ? 1 : 0]) {
      const potentialConnection = conversation.accounts[hint === 0 ? 1 : 0];
      // Ensure this potential connection is not one of the app user's accounts
      if (!accountsData.some(appAcc => appAcc.urn === potentialConnection.urn)) {
        return potentialConnection;
      }
    }
    // If still no connection found, return the first account that isn't the user's, or a default.
    // This placeholder returns the first account if only one, or second if first is user.
    const firstAccountIsUser = accountsData.some(appAcc => appAcc.urn === conversation.accounts[0]?.urn);
    if (conversation.accounts.length > 1 && firstAccountIsUser) return conversation.accounts[1];
    if (!firstAccountIsUser && conversation.accounts[0]) return conversation.accounts[0];
    return conversation.accounts[0]; // Default/fallback
  }
  return undefined;
};

const getAccountByUrnPlaceholder = (urn: string, accountsInConversation: Array<Partial<Account>>): Partial<Account> | undefined => {
  return accountsInConversation.find(acc => acc.urn === urn);
};
// --- END OF PLACEHOLDER HELPER FUNCTIONS ---


export const ConversationList = ({
  searchTerm,
  activeFilter,
  isPendingFilter,
  isMyMessagesFilter,
  selectedConversation,
  onSelectConversation
}: ConversationListProps) => {
  // Existing states
  // ...

  // Add state for selected sender accounts
  // This map tracks which accounts are selected for filtering (key = account id, value = boolean)
  const [selectedSenderAccounts, setSelectedSenderAccounts] = useState<Record<string, boolean>>({});
  const [isSenderFilterOpen, setIsSenderFilterOpen] = useState(false);
  const senderFilterRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData = [], isLoading: loading, error } = useConversationsQuery(
    isPendingFilter,
    //removed the searchTerm from here to avoid unnecessary re-renders
  );

  const { data: appUserAccountsData = [] } = useAccountsQuery();

  const getAccount = useCallback(
    (conversation: Conversation, type: "account" | "connection", sentByHint?: number) => {
      if (!conversation || !conversation.accountURNs || conversation.accountURNs.length === 0) {
        return undefined;
      }
      if (type === "account") {
        let accountUrn = conversation.accountURNs[0];
        let account = (appUserAccountsData ?? []).find((acc) => acc.urn === accountUrn);
        if (account) {
          return {
            urn: account.urn,
            firstName: account.firstName,
            lastName: account.lastName,
            profileImageUrl: account.profileImageUrl,
            sentBy: 1,
          };
        } else {
          if (conversation.accountURNs.length > 1) {
            accountUrn = conversation.accountURNs[1];
            account = (appUserAccountsData ?? []).find((acc) => acc.urn === accountUrn);
            return {
              urn: account?.urn,
              firstName: account?.firstName,
              lastName: account?.lastName,
              profileImageUrl: account?.profileImageUrl,
              sentBy: 0,
            };
          }
        }
        return { sentBy: 0, urn: undefined, firstName: undefined, lastName: undefined, profileImageUrl: undefined }; // Ensure all properties for type consistency
      }
      if (type === "connection") {
        const connectionIndex = sentByHint === 1 ? 1 : 0;
        if (conversation.accountURNs.length > connectionIndex) {
          const connectionUrn = conversation.accountURNs[connectionIndex];
          const connectionAccount = conversation.accounts.find((acc) => acc.urn === connectionUrn);
          // If connectionAccount is found, return it, otherwise, try to find any non-user account
          if (connectionAccount) return connectionAccount;
        }
        // Fallback: find the first account in conversation.accounts that is not one of the app user's accounts
        return conversation.accounts.find(acc => !(appUserAccountsData ?? []).some(userAcc => userAcc.urn === acc.urn));
      }
      return undefined;
    },
    [appUserAccountsData],
  );


  // const filteredConversations = useMemo(() => {
  //   // Assuming `conversationsData` is the array of conversations
  //   return conversationsData.filter(conversation => {
  //     // Your existing filtering logic based on isPendingFilter, isMyMessagesFilter
  //     // This example keeps the existing filter logic structure
  //     const primaryAppUserAccountForFilter = appUserAccountsData.length > 0 ? appUserAccountsData[0] : null; // Simplified for existing filter

  //     const lastMessageSentByAppUser = conversation.lastMessage && primaryAppUserAccountForFilter &&
  //       conversation.lastMessage.senderUrn === primaryAppUserAccountForFilter.urn;

  //     if (isPendingFilter && lastMessageSentByAppUser) {
  //       return false;
  //     }
  //     if (isMyMessagesFilter && !lastMessageSentByAppUser) {
  //       return false;
  //     }
  //     return true;
  //   });
  // }, [searchTerm, activeFilter, isPendingFilter, isMyMessagesFilter, conversationsData, appUserAccountsData]);

  // Check if any sender account filters are active
  const hasActiveSenderFilters = useMemo(() => {
    return Object.values(selectedSenderAccounts).some(selected => selected === true);
  }, [selectedSenderAccounts]);

  // Filter conversations based on selected sender accounts
  const filteredConversationsBySender = useMemo(() => {
    if (!conversationsData || conversationsData.length === 0) {
      return [];
    }

    // If no sender accounts are selected for filtering, return all conversations
    if (!hasActiveSenderFilters) {
      return conversationsData;
    }

    // Filter conversations by selected sender accounts
    return conversationsData.filter(conversation => {
      // Get all account URNs in this conversation
      const accountURNs = conversation.accounts.map(acc => acc.urn).filter(Boolean);

      // For each URN, check if it corresponds to a selected account
      for (const urn of accountURNs) {
        // Find the account with this URN
        const matchingAccount = appUserAccountsData.find(acc => acc.urn === urn);

        // If account exists and its ID is in the selected accounts map with value=true
        if (matchingAccount && matchingAccount.id && selectedSenderAccounts[matchingAccount.id]) {
          return true; // Include this conversation
        }
      }

      // None of this conversation's accounts match the selected filters
      return false;
    });
  }, [conversationsData, appUserAccountsData, selectedSenderAccounts, hasActiveSenderFilters]);

  // Update the finalFilteredConversations useMemo to properly implement all filters
  const finalFilteredConversations = useMemo(() => {
    let result = hasActiveSenderFilters ? filteredConversationsBySender : conversationsData;

    console.log("Filtered Conversations By Sender:", filteredConversationsBySender);

    // FIXED SEARCH LOGIC
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      
      result = result.filter(conversation => {
        // Check participant names
        const nameMatch = conversation.accounts?.some(account => {
          const first = (account.firstName || "").toLowerCase();
          const last = (account.lastName || "").toLowerCase();
          const full = `${first} ${last}`.trim();
          
          return first.includes(term) || 
                 last.includes(term) || 
                 full.includes(term);
        });
        
        // Check message content
        const messageMatch = (conversation.lastMessage?.text || "").toLowerCase().includes(term);
        
        return nameMatch || messageMatch;
      });
    }

    // "Awaiting Response" filter
    if (isPendingFilter) {
      const appUserUrns = appUserAccountsData.map(account => account.urn).filter(Boolean);
      result = result.filter(conversation =>
        conversation.lastMessage &&
        !appUserUrns.includes(conversation.lastMessage.senderUrn)
      );
    }

    // "My Messages" filter
    if (isMyMessagesFilter) {
      const appUserUrns = appUserAccountsData.map(account => account.urn).filter(Boolean);
      result = result.filter(conversation =>
        conversation.lastMessage &&
        appUserUrns.includes(conversation.lastMessage.senderUrn)
      );
    }

    // Deduplicate conversations by URN
    const deduplicatedConversations = Array.from(
      result.reduce((map, conversation) => {
        if (!conversation.urn) return map;

        const existing = map.get(conversation.urn);
        if (
          !existing ||
          (conversation.messages?.length || 0) > (existing.messages?.length || 0)
        ) {
          map.set(conversation.urn, conversation);
        }

        return map;
      }, new Map())
    ).map(([, conversation]) => conversation);

    return deduplicatedConversations;
  }, [
    conversationsData,
    filteredConversationsBySender,
    hasActiveSenderFilters,
    searchTerm,
    isPendingFilter,
    isMyMessagesFilter,
    appUserAccountsData
  ]);



  // Toggle a sender account filter
  const toggleSenderAccountFilter = (accountId: string) => {
    setSelectedSenderAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (senderFilterRef.current && !senderFilterRef.current.contains(event.target as Node)) {
        setIsSenderFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Render section for sender account filters
  const renderSenderAccountFilters = () => {
    if (!appUserAccountsData || appUserAccountsData.length === 0) {
      return null;
    }

    // Count active filters
    const activeFiltersCount = Object.values(selectedSenderAccounts).filter(Boolean).length;

    return (
      <div className="mb-4 relative" ref={senderFilterRef}>
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Filter by sender</h3>
          <button
            onClick={() => setIsSenderFilterOpen(prev => !prev)}
            className="flex items-center bg-white text-xs text-gray-600 hover:text-gray-900 py-1 px-2 border border-gray-200 rounded-md"
          >
            {activeFiltersCount > 0 && (
              <span className="mr-1 bg-white text-indigo-700 px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <span>Select accounts</span>
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isSenderFilterOpen ? 'transform rotate-180' : ''}`} />
          </button>
        </div>

        {isSenderFilterOpen && (
          <div className="absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 mt-1">
            <div className="max-h-60 overflow-y-auto">
              {appUserAccountsData.map(account => {
                const isSelected = !!selectedSenderAccounts[account.id];
                const accountName = `${account.firstName || ''} ${account.lastName || ''}`.trim() ||
                  account.email?.split('@')[0] || 'User';

                return (
                  <button
                    key={account.id}
                    onClick={() => toggleSenderAccountFilter(account.id)}
                    className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md mb-1 ${isSelected
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarFallback className={`text-[10px] ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                        {accountName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{accountName}</span>
                    {isSelected && (
                      <span className="text-indigo-600 ml-2">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            {activeFiltersCount > 0 && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <button
                  onClick={() => setSelectedSenderAccounts({})}
                  className="text-xs text-indigo-600 hover:text-indigo-800 w-full text-left px-3 py-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  // Replace your existing error handling with this proper error check
  if (error) {
    console.log("Error details:", error);

    // Check for CLIENT_ERROR or if no accounts are connected
    if ((error.message === "CLIENT_ERROR" ||
      (typeof error === 'object' && error.error === "No accounts found")) ||
      appUserAccountsData.length === 0) {

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-64 h-64 mb-6">
            {/* LinkedIn Accounts Disconnected Infographic */}
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Background Circle */}
              <circle cx="200" cy="150" r="120" fill="#f0f4ff" />

              {/* User Profile Icon */}
              <g className="profile-icon" opacity="0.8">
                <circle cx="150" cy="130" r="35" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="2" />
                <circle cx="150" cy="115" r="12" fill="#818cf8" />
                <rect x="130" y="132" width="40" height="20" rx="10" fill="#818cf8" />
              </g>

              {/* LinkedIn Icon - Added more margin from left side */}
              <g className="linkedin-icon animate-pulse">
                <rect x="265" y="105" width="60" height="60" rx="8" fill="#4f46e5" />
                <text
                  x="290"
                  y="145"
                  fontFamily="Arial"
                  fontSize="40"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                >
                  in
                </text>
              </g>

              {/* Broken Connection Line */}
              <path
                d="M190 130 L220 130 M235 130 L260 130"
                stroke="#d1d5db"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="5,5"
              />

              {/* Red X Mark - Properly centered */}
              <g className="x-mark">
                <circle cx="225" cy="130" r="17" fill="#fee2e2" />
                <path
                  d="M215 120 L235 140 M235 120 L215 140"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
              {/* Animation Styles */}
              <style>
                {`
          @keyframes pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
          .linkedin-icon {
            animation: pulse 2s infinite;
          }
        `}
              </style>
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No LinkedIn Accounts Connected
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Connect a LinkedIn account to view and respond to your messages
          </p>

          <Button
            variant="default"
            onClick={() => {
              // Navigate to accounts page or open connect account modal
              window.location.href = '/settings/accounts';
            }}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Connect LinkedIn Account
          </Button>
        </div>

      );
    }

    // Handle other types of errors with the default error message
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-red-500">Error loading conversations</div>
      </div>
    );
  }

  if (searchTerm && finalFilteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg border border-gray-200">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500 mb-6">No conversations match your search criteria</p>
        <Button
          variant="default"
          onClick={() => {/* Clear search logic */ }}
          className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div style={{
      scrollbarWidth: 'none',           // Firefox
      msOverflowStyle: 'none',          // IE 10+
    }} className="flex-1 overflow-y-auto bg-indigo-50/70 p-4 scrollbar-none">
      {/* Display sender account filters */}
      {renderSenderAccountFilters()}

      {hasActiveSenderFilters && (
        <div className="mb-3 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-700">
              Filtering by {Object.values(selectedSenderAccounts).filter(Boolean).length} sender(s)
            </span>
            <button
              onClick={() => setSelectedSenderAccounts({})}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Display conversations using finalFilteredConversations */}
      <div className="space-y-4">
        {finalFilteredConversations.map((conversation) => {
          const initialAppUserAccountDetails = getAccount(conversation, "account");
          const validAppUserAccountFound = !!initialAppUserAccountDetails?.urn;
          const primarySentByFullName = validAppUserAccountFound
            ? `${initialAppUserAccountDetails.firstName || ""} ${initialAppUserAccountDetails.lastName || ""}`.trim()
            : "";
          const connectionHint = initialAppUserAccountDetails?.sentBy;

          const isUndefinedInSentBy = !validAppUserAccountFound || primarySentByFullName === ""; // Simplified: empty name means undefined

          const accountTypeForUserDisplay = isUndefinedInSentBy ? "connection" : "account";
          const connectionTypeForOtherDisplay = isUndefinedInSentBy ? "account" : "connection";

          const otherPersonsAccountDetails = getAccount(conversation, connectionTypeForOtherDisplay, connectionHint);
          const otherPersonsName = `${otherPersonsAccountDetails?.firstName || ""} ${otherPersonsAccountDetails?.lastName || ""}`.trim() || "Unknown Contact";
          const otherPersonsInitials = `${(otherPersonsAccountDetails?.firstName?.[0] || '')}${(otherPersonsAccountDetails?.lastName?.[0] || '')}`.toUpperCase() || '??';
          const otherPersonsProfileImage = otherPersonsAccountDetails?.profileImageUrl || '';

          const appUsersAccountInvolvedDetails = getAccount(conversation, accountTypeForUserDisplay, accountTypeForUserDisplay === "connection" ? connectionHint : undefined);
          const appUsersAccountName = `${appUsersAccountInvolvedDetails?.firstName || ""} ${appUsersAccountInvolvedDetails?.lastName || ""}`.trim() || "Your Account";
          const appUserInvolvedUrn = appUsersAccountInvolvedDetails?.urn;

          // Determine sender of the last message for display
          const lastMessageSenderUrn = conversation.lastMessage?.senderUrn;
          let lastMessageSenderDisplayName = "Unknown Sender";
          let lastMessageSenderAvatarDetails: Partial<Account> | undefined = undefined;

          if (lastMessageSenderUrn === appUserInvolvedUrn) {
            lastMessageSenderDisplayName = appUsersAccountName; // Or "You"
            lastMessageSenderAvatarDetails = appUsersAccountInvolvedDetails;
          } else if (lastMessageSenderUrn === otherPersonsAccountDetails?.urn) {
            lastMessageSenderDisplayName = otherPersonsName;
            lastMessageSenderAvatarDetails = otherPersonsAccountDetails;
          } else if (lastMessageSenderUrn) {
            // Fallback for cases where sender URN is neither (e.g. group chat, or data mismatch)
            // Try to find this specific URN in the conversation.accounts array
            const senderDetails = conversation.accounts.find(acc => acc.urn === lastMessageSenderUrn);
            if (senderDetails) {
              lastMessageSenderDisplayName = `${senderDetails.firstName || ""} ${senderDetails.lastName || ""}`.trim() || "Unknown Sender";
              lastMessageSenderAvatarDetails = senderDetails;
            }
          } else if (conversation.lastMessage) {
            // If no sender URN but there is a last message, default to other person (common in some data structures)
            lastMessageSenderDisplayName = otherPersonsName;
            lastMessageSenderAvatarDetails = otherPersonsAccountDetails;
          }


          // Format the timestamp
          const lastActivityTime = conversation.lastActivityAtEpoch || conversation.lastActivityAt;
          let formattedTime = "";
          if (lastActivityTime) {
            const timestamp = typeof lastActivityTime === 'string' ? parseInt(lastActivityTime) : lastActivityTime;
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              const isToday = new Date().toDateString() === date.toDateString();
              formattedTime = isToday
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
          }

          const hasUnread = conversation.id.charCodeAt(0) % 3 === 0; // Placeholder logic for unread messages

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 transform ${selectedConversation?.id === conversation.id
                ? 'bg-indigo-100 border-2 border-indigo-300 shadow-md scale-[1.01]'
                : 'bg-white hover:bg-gray-50 border border-gray-100'
                }`}
            >
              <div className="p-3">
                {/* Contact info with improved spacing */}
                <div className="flex space-x-3">
                  <Avatar className="w-10 h-10 ring-2 ring-offset-2 ring-purple-500 flex-shrink-0">
                    {otherPersonsProfileImage && (
                      <AvatarImage
                        src={otherPersonsProfileImage}
                        alt={otherPersonsName}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <AvatarFallback className="bg-purple-200 text-gray-600 text-sm font-medium">
                      {otherPersonsInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[16px] font-bold mt-2  text-gray-900 truncate">{otherPersonsName}</h4>
                      <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                        {formattedTime}
                      </span>
                    </div>

                    {/* <p className="text-xs text-gray-500 truncate mt-0.5">
                      <span className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded-sm text-[10px] font-medium mr-1">Via</span>
                      <span className="font-medium">{appUsersAccountName}</span>
                    </p> */}
                  </div>
                </div>

                {/* Message preview with better visual grouping */}
                <div className="mt-0.5  pl-0.5  border-gray-100">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600 py-1 ml-12 font-semibold truncate pr-2 flex-grow pl-2 border-l-2 border-gray-300">
                      {conversation.lastMessage?.text || "No messages"}
                    </p>
                    {/* {hasUnread && (
                      <Badge className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1 shrink-0">
                        1
                      </Badge>
                    )} */}
                  </div>

                  {/* Last message sender with Via label positioned correctly */}
                  <div className="flex items-center bg-none rounded-r-lg py-1 pl-2 mt-1.5">
                    {/* Add the Via label here, before the user's avatar */}
                    <span className=" text-gray-500 px-1 py-0.5 rounded-sm text-[12px] font-medium mr-2">Sent By</span>

                    <div className="flex items-center bg-purple-100 rounded-full py-1 px-2 border border-purple-100">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center mr-1.5 overflow-hidden text-xs shrink-0">
                        {appUsersAccountInvolvedDetails?.profileImageUrl ? (
                          <img
                            src={appUsersAccountInvolvedDetails.profileImageUrl}
                            alt={appUsersAccountName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-[10px] text-gray-600 font-medium">
                            {`${(appUsersAccountInvolvedDetails?.firstName?.[0] || '')}${(appUsersAccountInvolvedDetails?.lastName?.[0] || '')}`.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-purple-700 font-medium">
                        {appUsersAccountName}
                      </span>
                      <BadgeCheck size={14} className="ml-1 fill-purple-600 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};