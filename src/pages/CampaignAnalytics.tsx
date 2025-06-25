import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Users, Send, MessageCircle, CheckCircle, RefreshCw, AlertCircle, ChevronDown, Filter, Search, Check } from 'lucide-react';
// Add this import for the dropdown components
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AsyncButton } from "@/components/async-button";
import { refreshCampaignLeads } from "@/api/campaigns";
import { useAccountsQuery } from "@/hooks/useAccountQueries";
import { DateTime } from 'luxon';
import { zoneMap } from '@/components/Campaign/ReviewLaunch';

// Add this enum at the top of your file
export enum LeadStatus {
  NONE = 'No Status',
  CONNECTION_EXISTS = 'Already Connected',
  CONNECTION_SENT = 'Connection Request Sent',
  CONNECTION_RECEIVED = 'Connection Request Received',
  CONNECTION_ACCEPTED = 'Connection Accepted',
  INVITATION_EXISTS = 'Invitation Already Sent',
  FOLLOW_UP = 'Follow-Up',
  SUCCESS = 'Successfully Engaged',
  PAUSED = 'Campaign Paused',
  PROCESSING = 'In Progress',
  RETRY_CONNECTION_SEND = 'Retrying Connection Request',
  RETRY_FETCH_URN_ONE = 'Retrying Lead Info Fetch failed once',
  RETRY_FETCH_URN_TWO = 'Retrying Lead Info Fetch failed twice',
  RETRY_MESSAGE_SEND = 'Retrying Message Send',
  FAILED = 'Action Failed',
  ACTIVE = 'Lead Active',
  INACTIVE = 'Lead Inactive',
}

// Define proper types based on the backend structure
interface BackendLead {
  url?: string;
  urn?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  lastActivity?: number;
  accountId?: string;
  configID?: number;
  timestamp?: number;
}

// Frontend lead structure for the component
interface Lead {
  id: number | string;
  name: string;
  status: string;
  lastActivity: string;
  assignedAccount: string;
  url?: string;
}

interface CampaignAnalyticsProps {
  leadData?: BackendLead[] | any;
  updateLeads?: (leads: any) => void;
  viewMode?: boolean;
  initialFilterStatus?: string;
  campaignInsights?: {
    connectionRequestsSent: number,
    connectionRequestsAccepted: number,
    messagesSent: number,
    responses: number
  };
  campaignData?: {
    timeZone : string;
  };
}

const CampaignAnalytics = ({
  campaignInsights,
  leadData = [],
  updateLeads = () => { },
  viewMode = false,
  initialFilterStatus = 'all',
  campaignData = {}
}: CampaignAnalyticsProps) => {
  // Extract timezone from campaign data or use browser default
  const userTimezone = useMemo(() => {
    return campaignData?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, [campaignData]);


  console.log(  "Campaign Analytics Props:", userTimezone)
  // Existing state variables
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilterStatus);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add this to fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();

  // Create a mapping of account IDs to account names
  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();

    if (accounts && accounts.length) {
      accounts.forEach(account => {
        if (account?.id) {
          const firstName = account.firstName || '';
          const lastName = account.lastName || '';
          const displayName = `${firstName} ${lastName}`.trim() || account.email?.split('@')[0] || 'Unknown';
          map.set(account.id, displayName);
        }
      });
    }

    return map;
  }, [accounts]);

  // Function to get account name from ID
  const getAccountName = (accountId: string | undefined) => {
    if (!accountId) return 'Unassigned';
    return accountNameMap.get(accountId) || accountId;
  };

  // Add the refreshLeads function
  const refreshLeads = async () => {
    if (!id) return;

    try {
      const result = await refreshCampaignLeads(id);

      // Re-fetch campaign data - this would need to be implemented at the parent level
      // and passed down as a prop if needed
      if (typeof updateLeads === 'function') {
        updateLeads(result?.data?.leads || []);
      }

      return result;
    } catch (error) {
      console.error("Failed to refresh leads:", error);
      throw error;
    }
  };

  // Add this useEffect to update the statusFilter when initialFilterStatus changes
  useEffect(() => {
    if (initialFilterStatus) {
      console.log("Filter status updated from prop:", initialFilterStatus);
      setStatusFilter(initialFilterStatus);
    }
  }, [initialFilterStatus]);
  // Add this state for the status dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Updated mapLeadStatus function
  const mapLeadStatus = (status?: string): string => {
    if (!status) return 'pending';

    // First, handle exact matches from the enum
    switch (status) {
      case LeadStatus.CONNECTION_EXISTS:
        return 'alreadyConnected';
      case LeadStatus.CONNECTION_SENT:
        return 'connectionSent';
      case LeadStatus.CONNECTION_ACCEPTED:
        return 'connected';
      case LeadStatus.CONNECTION_RECEIVED:
        return 'connectionReceived';
      case LeadStatus.INVITATION_EXISTS:
        return 'invitationSent';
      case LeadStatus.FOLLOW_UP:
        return 'followUp';
      case LeadStatus.SUCCESS:
        return 'success';
      case LeadStatus.PAUSED:
        return 'paused';
      case LeadStatus.PROCESSING:
        return 'processing';
      case LeadStatus.RETRY_CONNECTION_SEND:
      case LeadStatus.RETRY_FETCH_URN_ONE:
      case LeadStatus.RETRY_FETCH_URN_TWO:
      case LeadStatus.RETRY_MESSAGE_SEND:
        return 'retrying';
      case LeadStatus.FAILED:
        return 'failed';
      case LeadStatus.ACTIVE:
        return 'active';
      case LeadStatus.INACTIVE:
        return 'inactive';
      case LeadStatus.NONE:
        return 'pending';
      default:
        break;
    }

    // If no exact match, try to match based on content
    const statusLower = status.toLowerCase();

    if (statusLower.includes('already connected')) return 'alreadyConnected';
    if (statusLower.includes('connection request sent') || statusLower.includes('connection sent')) return 'connectionSent';
    if (statusLower.includes('connection accepted')) return 'connected';
    if (statusLower.includes('connection received')) return 'connectionReceived';
    if (statusLower.includes('invitation')) return 'invitationSent';
    if (statusLower.includes('follow-up')) return 'followUp';
    if (statusLower.includes('success')) return 'success';
    if (statusLower.includes('lead active')) return 'active';
    if (statusLower.includes('paused')) return 'paused';
    if (statusLower.includes('processing') || statusLower.includes('progress')) return 'processing';
    if (statusLower.includes('retry')) return 'retrying';
    if (statusLower.includes('fail')) return 'failed';
    if (statusLower.includes('inactive')) return 'inactive';

    // Default fallback
    return 'processing';
  };

  // Map backend leads to frontend format
  const allLeads = useMemo(() => {
    console.log("The leadData is", leadData);

    // If leadData is not provided, not an array, or is empty, return an empty array.
    if (!leadData || !Array.isArray(leadData) || leadData.length === 0) {
      // setShowDataWarning(true); // Optionally set a warning if it's unexpected for leadData to be empty
      return [];
    }

    try {
      const mappedLeads = leadData; // Already an array from props
      console.log("Mapped Leads:", mappedLeads);

      return mappedLeads.map((lead: BackendLead, index: number) => {
        // Format timestamp to readable date if available using Luxon with timezone
        let formattedDate = 'N/A';
        if (lead.lastActivity) {
          const timestamp = lead.lastActivity;
          try {
            const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            
            const mappedTimezone = zoneMap[userTimezone] || userTimezone;
            
            formattedDate = DateTime.fromMillis(timeMs)
              .setZone(mappedTimezone)
              .toFormat('HH:mm, d MMM, yyyy (z)');
          } catch (e) {
            formattedDate = 'Invalid date';
          }
        }

        const mappedStatus = mapLeadStatus(lead.status);
        const accountName = getAccountName(lead.accountId);

        return {
          id: lead.urn || `lead-${index}`, // Use URN if available for a more stable key
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.url || 'Unnamed Lead',
          status: mappedStatus,
          lastActivity: formattedDate,
          assignedAccount: accountName,
          accountId: lead.accountId,
          url: lead.url,
          rawStatus: lead.status
        };
      });
    } catch (error) {
      console.error("Error processing lead data:", error);
      setShowDataWarning(true);
      return []; // Return empty array on error
    }
  }, [leadData, accountNameMap, userTimezone, getAccountName, mapLeadStatus]); // Added mapLeadStatus and getAccountName to dependencies

  // Analytics data calculated from actual leads
  const analytics = useMemo(() => [
    {
      title: 'New Connection Sent',
      value: campaignInsights.connectionRequestsSent,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Requests Accepted',
      value: campaignInsights.connectionRequestsAccepted,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500'
    },
    {
      title: 'Messages Sent',
      value: campaignInsights.messagesSent,
      icon: Send,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Responses',
      value: campaignInsights.responses,
      icon: MessageCircle,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    }
  ], [campaignInsights]); // Removed allLeads dependency if insights are passed directly

  // Get unique assigned accounts for dropdown with real names
  const assignedAccounts = useMemo(() => {
    return Array.from(new Set(allLeads.map(lead => lead.assignedAccount))).sort();
  }, [allLeads]);


  console.log("Assigned Accounts:", assignedAccounts);
  // Add this after your existing state variables
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Update the filteredLeads useMemo to filter by multiple accounts
  const filteredLeads = useMemo(() => {
    const filtered = allLeads.filter(lead => {
      // Search filter - check both name and URL
      const matchesSearch =
        (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.url && lead.url.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

      // Multiple accounts filter - match by account display name
      const matchesAccounts = selectedAccounts.length === 0 ||
        selectedAccounts.includes(lead.assignedAccount);

      return matchesSearch && matchesStatus && matchesAccounts;
    });

    return filtered;
  }, [allLeads, searchQuery, statusFilter, selectedAccounts]);


  console.log("Filtered Leads:", filteredLeads);
  // Updated getStatusDisplay function
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'alreadyConnected':
        return { label: 'Already Connected', className: 'bg-teal-100 text-teal-700 border-teal-200' };
      case 'connectionSent':
        return { label: 'Connection Sent', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'connected':
        return { label: 'Connected', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'connectionReceived':
        return { label: 'Connection Received', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'invitationSent':
        return { label: 'Invitation Sent', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'followUp':
        return { label: 'Follow-Up', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'success':
        return { label: 'Successfully Engaged', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'paused':
        return { label: 'Paused', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'processing':
        return { label: 'Processing', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'retrying':
        return { label: 'Retrying', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'failed':
        return { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'active':
        return { label: 'Lead Active', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'inactive':
        return { label: 'Lead Inactive', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'pending':
        return { label: 'Pending', className: 'bg-purple-100 text-purple-700 border-purple-200' };
      default:
        // For any unmapped status, capitalize first letter and use gray styling
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  const shortenLinkedInUrl = (url: string | undefined): string => {
    if (!url) return '';

    // For LinkedIn profile URLs
    if (url.includes('linkedin.com/in/')) {
      // Extract username part
      const username = url.split('/in/')[1]?.split('/')[0] || '';
      if (username.length > 10) {
        return `linkedin.com/in/${username.substring(0, 8)}...`;
      } else {
        return `linkedin.com/in/${username}`;
      }
    }

    // For other LinkedIn URLs
    if (url.includes('linkedin.com')) {
      const parts = url.replace('https://', '').replace('http://', '').replace('www.', '').split('/');
      if (parts.length > 2 && parts[1].length > 10) {
        return `${parts[0]}/${parts[1].substring(0, 8)}...`;
      }
      return url.replace('https://www.', '').replace('http://www.', '').substring(0, 25) + '...';
    }

    // For non-LinkedIn URLs
    if (url.length > 30) {
      return url.substring(0, 27) + '...';
    }

    return url;
  };

  // Updated getStatusCounts function
  const getStatusCounts = () => {
    return {
      all: allLeads.length,
      connectionSent: allLeads.filter(lead => lead.status === 'connectionSent').length,
      alreadyConnected: allLeads.filter(lead => lead.status === 'alreadyConnected').length,
      connected: allLeads.filter(lead => lead.status === 'connected').length,
      connectionReceived: allLeads.filter(lead => lead.status === 'connectionReceived').length,
      invitationSent: allLeads.filter(lead => lead.status === 'invitationSent').length,
      followUp: allLeads.filter(lead => lead.status === 'followUp').length,
      success: allLeads.filter(lead => lead.status === 'success').length,
      paused: allLeads.filter(lead => lead.status === 'paused').length,
      processing: allLeads.filter(lead => lead.status === 'processing').length,
      retrying: allLeads.filter(lead => lead.status === 'retrying').length,
      failed: allLeads.filter(lead => lead.status === 'failed').length,
      active: allLeads.filter(lead => lead.status === 'active').length,
      inactive: allLeads.filter(lead => lead.status === 'inactive').length,
      pending: allLeads.filter(lead => lead.status === 'pending').length
    };
  };

  const statusCounts = getStatusCounts();

  // Get all available statuses for the dropdown
  const availableStatuses = useMemo(() => {
    const statusMap = {
      all: 'All Statuses',
      connectionSent: 'Connection Sent',
      alreadyConnected: 'Already Connected',
      connected: 'Connected',
      //   connectionReceived: 'Connection Received',
      invitationSent: 'Invitation Sent',
      followUp: 'Follow-Up',
      success: 'Successfully Engaged',
      //   paused: 'Paused',
      //   processing: 'Processing',
      retrying: 'Retrying',
      failed: 'Failed',
      active: 'Lead Active',
      //   inactive: 'Lead Inactive',
      //   pending: 'Pending'
    };

    return Object.entries(statusMap).map(([key, label]) => ({
      value: key,
      label,
      count: statusCounts[key as keyof typeof statusCounts] || 0
    }));
  }, [statusCounts]);

  return (
    <div className="space-y-6">
      {/* Data Warning */}
      {showDataWarning && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
          <AlertDescription className="text-amber-800">
            Some lead data couldn't be processed correctly. The display might be incomplete.
          </AlertDescription>
        </Alert>
      )}

      {/* Leads Table with Refresh Button */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Campaign Leads</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {viewMode ? 'View of leads in this campaign' : 'Detailed view of all leads in this campaign'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
                {filteredLeads.length} of {allLeads.length} Leads
              </div>

              {/* Add AsyncButton for refreshing leads */}
              <AsyncButton
                onClick={refreshLeads}
                label="Refresh Leads Status"
                loadingLabel="Refreshing..."
                successMessage="Leads Status refreshed successfully"
                errorMessage="Failed to refresh leads status"
                variant="outline"
                size="sm"
                icon={<RefreshCw className="h-4 w-4 mr-2" />}
                className="text-sm"
              />
            </div>
          </div>
        </CardHeader>

        {/* Filters Section - Only show if not in view mode */}
        {!viewMode && (
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-9 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50 max-h-64 overflow-auto">
                      <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                      <SelectItem value="connectionSent">Connection Sent ({statusCounts.connectionSent})</SelectItem>
                      <SelectItem value="alreadyConnected">Already Connected ({statusCounts.alreadyConnected})</SelectItem>
                      <SelectItem value="connected">Connected ({statusCounts.connected})</SelectItem>
                      <SelectItem value="active">Lead Active ({statusCounts.active})</SelectItem>
                      <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
                      <SelectItem value="retrying">Retrying ({statusCounts.retrying})</SelectItem>
                      <SelectItem value="failed">Failed ({statusCounts.failed})</SelectItem>
                      <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                      {/* Add other statuses if needed */}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Account Filter */}
                {/* Sender Accounts Multi-Select Filter */}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 flex items-center justify-between gap-1 min-w-[13rem] px-3"
                        >
                          <span className="text-sm">
                            {selectedAccounts.length === 0
                              ? "Filter by accounts"
                              : `${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''}`
                            }
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[280px] bg-white border border-gray-200 shadow-lg rounded-lg p-1 max-h-[300px] overflow-y-auto"
                      >
                        {/* Show loading state */}
                        {accountsLoading ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            <div className="flex items-center justify-center my-2">
                              <div className="w-4 h-4 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                              <span className="ml-2">Loading accounts...</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Search input for accounts */}
                            <div className="p-2 border-b border-gray-100">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  placeholder="Search accounts..."
                                  className="pl-8 h-8 text-sm"
                                />
                              </div>
                            </div>

                            {/* Select all option */}
                            <div
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                if (selectedAccounts.length === assignedAccounts.length) {
                                  setSelectedAccounts([]);
                                } else {
                                  setSelectedAccounts([...assignedAccounts]);
                                }
                              }}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center mr-2 ${selectedAccounts.length === assignedAccounts.length
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                                }`}>
                                {selectedAccounts.length === assignedAccounts.length && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm font-medium">Select All</span>
                              <Badge className="ml-auto bg-gray-100 text-gray-600 hover:bg-gray-200">
                                {assignedAccounts.length}
                              </Badge>
                            </div>

                            {/* Account options */}
                            <div className="py-1">
                              {assignedAccounts.length === 0 ? (
                                <div className="p-2 text-center text-sm text-gray-500">
                                  No accounts available
                                </div>
                              ) : (
                                assignedAccounts.map(account => {
                                  const isSelected = selectedAccounts.includes(account);
                                  const count = allLeads.filter(lead => lead.assignedAccount === account).length;

                                  return (
                                    <div
                                      key={account}
                                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedAccounts(selectedAccounts.filter(a => a !== account));
                                        } else {
                                          setSelectedAccounts([...selectedAccounts, account]);
                                        }
                                      }}
                                    >
                                      <div className={`w-4 h-4 border rounded flex items-center justify-center mr-2 ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                        }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className="text-sm truncate max-w-[180px]">{account}</span>
                                      <Badge className="ml-auto bg-gray-100 text-gray-600 hover:bg-gray-200">
                                        {count}
                                      </Badge>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Action buttons */}
                            {selectedAccounts.length > 0 && (
                              <div className="border-t border-gray-100 p-2 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAccounts([])}
                                  className="text-xs text-gray-600"
                                >
                                  Clear selection
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active filters display */}
        {(searchQuery || statusFilter !== 'all' || selectedAccounts.length > 0) && (
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 flex items-center gap-1">
                <Search className="w-3 h-3" />
                <span>{searchQuery}</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-blue-700/70 hover:text-blue-800"
                >
                  &times;
                </button>
              </Badge>
            )}

            {statusFilter !== 'all' && (
              <Badge variant="outline" className={`${getStatusDisplay(statusFilter).className} flex items-center gap-1`}>
                <span>{getStatusDisplay(statusFilter).label}</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 opacity-70 hover:opacity-100"
                >
                  &times;
                </button>
              </Badge>
            )}

            {selectedAccounts.map(account => (
              <Badge
                key={account}
                variant="outline"
                className="bg-purple-50 border-purple-100 text-purple-700 flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{account}</span>
                <button
                  onClick={() => setSelectedAccounts(selectedAccounts.filter(a => a !== account))}
                  className="ml-1 text-purple-700/70 hover:text-purple-800"
                >
                  &times;
                </button>
              </Badge>
            ))}

            {(searchQuery || statusFilter !== 'all' || selectedAccounts.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedAccounts([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 ml-auto underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`bg-gray-50 hover:bg-gray-50 border-b border-gray-200 ${viewMode ? 'bg-blue-50/30' : ''}`}>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Lead</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {viewMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-5 w-5 ml-1 hover:bg-gray-200 rounded-sm"
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-md rounded-md p-1">
                            {availableStatuses.map((status) => (
                              <DropdownMenuItem
                                key={status.value}
                                onClick={() => setStatusFilter(status.value)}
                                className={`text-sm px-3 py-2 rounded-sm cursor-pointer ${statusFilter === status.value ? 'bg-gray-100' : 'hover:bg-gray-50'
                                  }`}
                              >
                                <span>{status.label}</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-gray-50 text-gray-700 text-xs font-normal"
                                >
                                  {status.count}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Last Activity</TableHead>

                  {/* Add dropdown to Assigned Account column */}
                  <TableHead className="font-medium text-gray-700 py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <span>Assigned Account</span>
                      {viewMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-5 w-5 ml-1 hover:bg-gray-200 rounded-sm"
                            >
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-64 bg-white border border-gray-200 shadow-md rounded-md p-1 max-h-64 overflow-y-auto">
                            {/* Select All option */}
                            <div
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                if (selectedAccounts.length === assignedAccounts.length) {
                                  setSelectedAccounts([]);
                                } else {
                                  setSelectedAccounts([...assignedAccounts]);
                                }
                              }}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center mr-2 ${selectedAccounts.length === assignedAccounts.length
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                                }`}>
                                {selectedAccounts.length === assignedAccounts.length && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm font-medium">All Accounts</span>
                              <Badge className="ml-auto bg-gray-100 text-gray-600 hover:bg-gray-200">
                                {allLeads.length}
                              </Badge>
                            </div>

                            {/* Account options */}
                            {assignedAccounts.map((account) => {
                              const isSelected = selectedAccounts.includes(account);
                              const count = allLeads.filter(lead => lead.assignedAccount === account).length;

                              return (
                                <div
                                  key={account}
                                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedAccounts(selectedAccounts.filter(a => a !== account));
                                    } else {
                                      setSelectedAccounts([...selectedAccounts, account]);
                                    }
                                  }}
                                >
                                  <div className={`w-4 h-4 border rounded flex items-center justify-center mr-2 ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                    }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="text-sm truncate max-w-[180px]">{account}</span>
                                  <Badge className="ml-auto bg-gray-100 text-gray-600 hover:bg-gray-200">
                                    {count}
                                  </Badge>
                                </div>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableHead>

                  {!viewMode && (
                    <TableHead className="font-medium text-gray-700 py-3 px-4">LinkedIn URL</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={viewMode ? 4 : 5} className="text-center py-8 text-gray-500">
                      {allLeads.length === 0 ? "No Valid leads found in your CSV file" : "No leads found matching your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const statusDisplay = getStatusDisplay(lead.status);
                    const isHighlighted = selectedAccounts.length > 0 && selectedAccounts.includes(lead.assignedAccount);

                    return (
                      <TableRow
                        key={lead.id} // Ensure lead.id is unique and stable
                        className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${isHighlighted ? 'bg-blue-50/30' : ''
                          }`}
                      >
                        <TableCell className="py-3 px-4">
                          <a 
                            href={lead.url || '#'} 
                            target={lead.url ? "_blank" : "_self"} 
                            rel="noopener noreferrer" 
                            className={`text-gray-900 font-medium ${lead.url ? 'hover:underline' : 'cursor-default'}`}
                          >
                            {lead.name || shortenLinkedInUrl(lead.url) || 'N/A'}
                          </a>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusDisplay.className} inline-block min-w-0`}>
                            {statusDisplay.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 py-3 px-4 text-sm">{lead.lastActivity}</TableCell>
                        <TableCell className={`py-3 px-4 text-sm font-medium ${isHighlighted ? 'text-blue-700' : 'text-gray-700'}`}>
                          {lead.assignedAccount}
                        </TableCell>
                        {!viewMode && (
                          <TableCell className="py-3 px-4 text-sm text-blue-600">
                            {lead.url && (
                              <a
                                href={lead.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline block max-w-[200px]"
                                title={lead.url} // Add title for full URL on hover
                              >
                                {shortenLinkedInUrl(lead.url)}
                              </a>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignAnalytics;
