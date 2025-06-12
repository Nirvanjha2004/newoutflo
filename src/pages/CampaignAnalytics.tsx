import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Users, Send, MessageCircle, CheckCircle, Search, Filter, AlertCircle, ChevronDown } from 'lucide-react';
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

// Add this enum at the top of your file
export enum LeadStatus {
  NONE = 'No Status',
  CONNECTION_EXISTS = 'Already Connected',
  CONNECTION_SENT = 'Connection Request Sent',
  CONNECTION_RECEIVED = 'Connection Request Received',
  CONNECTION_ACCEPTED = 'Connection Accepted',
  INVITATION_EXISTS = 'Invitation Already Sent',
  FOLLOW_UP = 'Follow-Up Needed',
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
  campaignInsights?: {
    connectionRequestsSent: number,
    connectionRequestsAccepted: number,
    messagesSent: number,
    responses: number
  };
}

const CampaignAnalytics = ({ 
  campaignInsights,
  leadData = [], 
  updateLeads = () => {}, 
  viewMode = false 
}: CampaignAnalyticsProps) => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedAccountFilter, setAssignedAccountFilter] = useState('all');
  const [showDataWarning, setShowDataWarning] = useState(false);
  
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

  // Sample data fallback function - MOVED UP HERE to fix the error
  const getSampleLeads = (): Lead[] => {
    return [
      {
        id: 1,
        name: 'Aryan',
        status: 'connectionSent',
        lastActivity: '08:02 GMT, 9 June, 2025',
        assignedAccount: 'Siddhi Kirtania'
      },
      {
        id: 2,
        name: 'Ammar',
        status: 'processing',
        lastActivity: '08:33 GMT, 9 June, 2025',
        assignedAccount: 'Twinkle Janagal'
      },
      {
        id: 3,
        name: 'Aakash',
        status: 'connectionSent',
        lastActivity: '08:02 GMT, 9 June, 2025',
        assignedAccount: 'Aryan Sharma'
      },
      {
        id: 4,
        name: 'Vijay',
        status: 'success',
        lastActivity: '08:50 GMT, 10 June, 2025',
        assignedAccount: 'Mitesh Bhardwaj'
      },
      {
        id: 5,
        name: 'pushkar',
        status: 'failed',
        lastActivity: '08:03 GMT, 9 June, 2025',
        assignedAccount: 'Srividhya Chandrasekar'
      },
      {
        id: 6,
        name: 'Praveen',
        status: 'success',
        lastActivity: '11:49 GMT, 10 June, 2025',
        assignedAccount: 'Siddhi Kirtania'
      },
      {
        id: 7,
        name: 'Rahul',
        status: 'processing',
        lastActivity: '14:20 GMT, 10 June, 2025',
        assignedAccount: 'Twinkle Janagal'
      },
      {
        id: 8,
        name: 'Priya',
        status: 'failed',
        lastActivity: '16:45 GMT, 10 June, 2025',
        assignedAccount: 'Aryan Sharma'
      }
    ];
  };

  // Map backend leads to frontend format - WITHOUT FIELD MAPPINGS
  const allLeads = useMemo(() => {
    console.log("The leadData is", leadData);
    
    // Return sample data if no real data exists
    if (!leadData || (Array.isArray(leadData) && leadData.length === 0)) {
      return getSampleLeads();
    }

    try {
      // Backend data is already an array - no need to check for leadData.data
      const mappedLeads = Array.isArray(leadData) ? leadData : [];
      console.log("Mapped Leads:", mappedLeads);
      
      return mappedLeads.map((lead: BackendLead, index: number) => {
        // DIRECT USE: Don't process url/firstName/lastName/accountId
        // Just use the raw values directly from the backend
        const url = lead.url || lead.firstName || '';
        
        // Format timestamp to readable date if available (keeping this for readability)
        let formattedDate = 'N/A';
        if (lead.lastActivity) {
          const timestamp = lead.lastActivity;
          try {
            const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
            formattedDate = format(date, 'HH:mm z, d MMM, yyyy');
          } catch (e) {
            formattedDate = 'Invalid date';
          }
        }
        
        // Keep status mapping since this is explicitly not included in removal request
        let mappedStatus = mapLeadStatus(lead.status);
        
        return {
          id: index,
          name: url, // Just use url as name directly
          status: mappedStatus,
          lastActivity: formattedDate,
          assignedAccount: lead.accountId || 'Unassigned', // Use raw accountId
          url: url, // No processing
          rawStatus: lead.status
        };
      });
    } catch (error) {
      console.error("Error processing lead data:", error);
      setShowDataWarning(true);
      return getSampleLeads();
    }
  }, [leadData]);

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
  ], [allLeads]);

  // Get unique assigned accounts for dropdown
  const assignedAccounts = useMemo(() => {
    return Array.from(new Set(allLeads.map(lead => lead.assignedAccount))).sort();
  }, [allLeads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {

    console.log('All leads are', allLeads)
    let filtered = allLeads.filter(lead => {
      // Search filter - check both name and URL
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (lead.url && lead.url.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      // Assigned account filter
      const matchesAssignedAccount = assignedAccountFilter === 'all' || lead.assignedAccount === assignedAccountFilter;
      
      return matchesSearch && matchesStatus && matchesAssignedAccount;
    });

    // Sort by assigned account (selected account first) then by name
    if (assignedAccountFilter !== 'all') {
      filtered.sort((a, b) => {
        if (a.assignedAccount === assignedAccountFilter && b.assignedAccount !== assignedAccountFilter) return -1;
        if (a.assignedAccount !== assignedAccountFilter && b.assignedAccount === assignedAccountFilter) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }, [allLeads, searchQuery, statusFilter, assignedAccountFilter]);


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
        return { label: 'Follow-Up Needed', className: 'bg-amber-100 text-amber-700 border-amber-200' };
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
      followUp: 'Follow-Up Needed',
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
      {/* Data Warning for problematic backend data */}
      {showDataWarning && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
          <AlertDescription className="text-amber-800">
            Some lead data couldn't be processed correctly. The display might be incomplete.
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {analytics.map((metric, index) => (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Total count</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Campaign Leads</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {viewMode ? 'View of leads in this campaign' : 'Detailed view of all leads in this campaign'}
              </p>
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
              {filteredLeads.length} of {allLeads.length} Leads
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
                <Select value={assignedAccountFilter} onValueChange={setAssignedAccountFilter}>
                  <SelectTrigger className="w-56 h-9 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400">
                    <SelectValue placeholder="Filter by assigned account" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                    <SelectItem value="all">All Assigned Accounts</SelectItem>
                    {assignedAccounts.map((account) => (
                      <SelectItem key={account} value={account}>
                        {account} ({allLeads.filter(lead => lead.assignedAccount === account).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-md rounded-md p-1">
                            {availableStatuses.map((status) => (
                              <DropdownMenuItem 
                                key={status.value}
                                onClick={() => setStatusFilter(status.value)}
                                className={`text-sm px-3 py-2 rounded-sm cursor-pointer flex justify-between items-center ${
                                  statusFilter === status.value ? 'bg-gray-100' : 'hover:bg-gray-50'
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
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-64 bg-white border border-gray-200 shadow-md rounded-md p-1 max-h-64 overflow-y-auto">
                            <DropdownMenuItem 
                              onClick={() => setAssignedAccountFilter('all')}
                              className={`text-sm px-3 py-2 rounded-sm cursor-pointer flex justify-between items-center ${
                                assignedAccountFilter === 'all' ? 'bg-gray-100' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span>All Accounts</span>
                              <Badge 
                                variant="outline" 
                                className="ml-2 bg-gray-50 text-gray-700 text-xs font-normal"
                              >
                                {allLeads.length}
                              </Badge>
                            </DropdownMenuItem>
                            
                            {assignedAccounts.map((account) => (
                              <DropdownMenuItem 
                                key={account}
                                onClick={() => setAssignedAccountFilter(account)}
                                className={`text-sm px-3 py-2 rounded-sm cursor-pointer flex justify-between items-center ${
                                  assignedAccountFilter === account ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="truncate max-w-[180px]">{account}</span>
                                <Badge 
                                  variant="outline" 
                                  className="ml-2 bg-gray-50 text-gray-700 text-xs font-normal"
                                >
                                  {allLeads.filter(lead => lead.assignedAccount === account).length}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
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
                      No leads found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const statusDisplay = getStatusDisplay(lead.status);
                    const isHighlighted = assignedAccountFilter !== 'all' && lead.assignedAccount === assignedAccountFilter;
                    
                    return (
                      <TableRow 
                        key={lead.id} 
                        className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          isHighlighted ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <TableCell className="py-3 px-4">
                          {/* Show only the name, no status or ID */}
                          <span className="text-gray-900 font-medium">{lead.url}</span>
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
                              <a href={lead.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block max-w-[200px]">
                                {lead.url.replace('https://www.linkedin.com/in/', '')}
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
