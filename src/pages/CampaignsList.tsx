import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Users, Send, MessageCircle, Loader2, MoreVertical, BarChart3, Pause, StopCircle, Eye, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCampaignsQuery } from '@/hooks/useCampaignQueries';
import { useCampaignInsightsQueries } from '@/hooks/useCampaignInsights';
import { CampaignState } from '@/types/campaigns';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateCampaign } from '@/hooks/useCampaignMutations';
import { toast } from "@/components/ui/use-toast";

const CampaignsListContent = () => {
  // Use the campaigns API hook
  const { data: campaigns = [], isLoading, error } = useCampaignsQuery();
  
  // Extract campaign IDs for insights fetching
  const campaignIds = campaigns.map(campaign => campaign.id).filter(Boolean);
  
  // Use the insights queries hook
  const { 
    data: campaignInsightsMap = {},
    isLoading: insightsLoading
  } = useCampaignInsightsQueries(campaignIds);
  
  // Merge campaigns with their insights
  const campaignsWithInsights = React.useMemo(() => {
    return campaigns.map(campaign => ({
      ...campaign,
      insights: campaignInsightsMap[campaign.id] || {
        connectionsSent: 0,
        connectionsAccepted: 0,
        messagesSent: 0,
        messagesReceived: 0
      }
    }));
  }, [campaigns, campaignInsightsMap]);
  
  // Calculate total statistics using the enhanced campaigns data
  const totalLeads = campaignsWithInsights.reduce((sum, c) => sum + (c.leads?.length || 0), 0);
  const totalSent = campaignsWithInsights.reduce((sum, c) => {
    // If we have insights, use them
    if (c.insights) {
      return sum + (c.insights.connectionRequestsSent || 0);
    }
    return sum;
  }, 0);
  
  const totalAccepted = campaignsWithInsights.reduce((sum, c) => {
    if (c.insights) {
      return sum + (c.insights.connectionRequestsAccepted || 0);
    }
    return sum;
  }, 0);
  
  const totalReplies = campaignsWithInsights.reduce((sum, c) => {
    if (c.insights) {
      return sum + (c.insights.responses || 0);
    }
    return sum;
  }, 0);

  // Count active campaigns
  const activeCampaigns = campaignsWithInsights.filter(c => c.state === CampaignState.RUNNING).length;

  // Map campaign state to UI status
  const getStatusFromState = (state: CampaignState | undefined) => {
    if (state === undefined) return 'Unknown';
    switch (state) {
      case CampaignState.RUNNING:
        return 'Active';
      case CampaignState.PAUSED:
        return 'Paused';
      case CampaignState.STOPPED:
        return 'Stopped';
      case CampaignState.COMPLETED:
        return 'Completed';
      default:
        return 'Draft';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'Paused':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Stopped':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'Completed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Format date from epoch timestamp
  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Convert string to number if needed
      const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      
      // Check if timestamp is valid
      if (isNaN(numericTimestamp)) return 'Invalid Date';
      
      // Check if timestamp needs conversion (epoch in seconds vs milliseconds)
      // If timestamp is in seconds (10 digits or less), convert to milliseconds
      const dateValue = numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp;
      
      // Format the date in a more readable way
      return format(new Date(dateValue), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid Date';
    }
  };

  // Add this new helper function for relative time display
  const getRelativeTime = (timestamp?: number | string) => {
    if (!timestamp) return '';
    try {
      const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      if (isNaN(numericTimestamp)) return '';
      
      const dateValue = numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp;
      const now = new Date();
      const date = new Date(dateValue);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return '';
    }
  };

  const queryClient = useQueryClient();
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Add this helper function
  const handleCampaignStatusChange = async (campaignId: string, newState: CampaignState) => {
    if (!campaignId) return;
    
    setActionInProgress(campaignId);
    
    try {
      await updateCampaign({
        campaignId,
        campaignData: { status: newState }
      });
      
      // Refresh campaign data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      const actionText = 
        newState === CampaignState.PAUSED || CampaignState.MANUALPAUSED ? 'paused' : 
        newState === CampaignState.RUNNING ? 'resumed' : 'stopped';
        
      toast({
        title: 'Success',
        description: `Campaign ${actionText} successfully`
      });
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      toast({
        variant: "destructive",
        title: 'Action failed',
        description: 'Could not update campaign status. Please try again.'
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            Campaign Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage and track your outreach campaigns with powerful analytics
          </p>
        </div>
        
        <Link to="/campaign">
          <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-6 py-3 text-base font-semibold">
            <Plus className="w-5 h-5" />
            Start New Campaign
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : campaignsWithInsights.length}
            </div>
            <p className="text-sm text-gray-500">All time</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : activeCampaigns}
            </div>
            <p className="text-sm text-gray-500">Currently running</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalLeads}
            </div>
            <p className="text-sm text-gray-500">Prospects reached</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Replies</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalReplies}
            </div>
            <p className="text-sm text-gray-500">Engagement received</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="border-0 shadow-xl mb-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-900">Campaign Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Filter
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg text-gray-700">Loading campaigns...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-4xl">!</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Error loading campaigns</h3>
              <p className="text-red-600 mb-8 max-w-md mx-auto">
                {error.message || "An unexpected error occurred"}
              </p>
            </div>
          ) : campaignsWithInsights.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-purple-200 rounded-full flex items-center justify-center">
                <Plus className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ready to start your first campaign?</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create targeted outreach campaigns and connect with your ideal prospects through personalized messaging.
              </p>
              <Link to="/campaign">
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg px-8 py-3">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50 text-xs uppercase">
                    <TableHead className="font-semibold text-gray-700 cursor-pointer hover:text-primary transition-colors">
                      <div className="flex items-center">
                        Campaign Name
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 cursor-pointer hover:text-primary transition-colors">
                      <div className="flex items-center">
                        Leads
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Sent</TableHead>
                    <TableHead className="font-semibold text-gray-700">Accepted</TableHead>
                    <TableHead className="font-semibold text-gray-700">Replies</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsWithInsights.map((campaign) => (
                    <TableRow key={campaign.id} className="group border-b hover:bg-gray-50/80 transition-colors duration-150">
                      <TableCell className="font-semibold text-gray-900 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-primary mr-3 flex items-center justify-center text-white font-bold">
                            {campaign.name.charAt(0).toUpperCase()}
                          </div>
                          {campaign.name}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {(() => {
                          const status = getStatusFromState(campaign.state);
                          const statusColor = getStatusColor(status);
                          const statusBg = statusColor.split(' ')[1]; // Extract bg color class
                          
                          return (
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${statusBg.replace('100', '400')}`}></div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                                {status}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{campaign.leads?.length || 0}</span>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                            <div className="h-full bg-purple-500 rounded-full" style={{width: '100%'}}></div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          {insightsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            <>
                              <span className="font-medium">{campaign.insights?.connectionRequestsSent || 0}</span>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                                <div 
                                  className="h-full bg-blue-500 rounded-full" 
                                  style={{
                                    width: `${campaign.leads?.length ? Math.min(100, (campaign.insights?.connectionRequestsSent || 0) / campaign.leads.length * 100) : 0}%`
                                  }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          {insightsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            <>
                              <span className="font-medium">{campaign.insights?.connectionRequestsAccepted || 0}</span>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                                <div 
                                  className="h-full bg-green-500 rounded-full" 
                                  style={{
                                    width: `${campaign.insights?.connectionRequestsSent ? Math.min(100, (campaign.insights.connectionRequestsAccepted || 0) / campaign.insights.connectionRequestsSent * 100) : 0}%`
                                  }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          {insightsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            <>
                              <span className="font-medium">{campaign.insights?.responses || 0}</span>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                                <div 
                                  className="h-full bg-amber-500 rounded-full" 
                                  style={{
                                    width: `${campaign.insights?.connectionRequestsAccepted ? Math.min(100, (campaign.insights.responses || 0) / campaign.insights.connectionRequestsAccepted * 100) : 0}%`
                                  }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-gray-600">{formatDate(campaign.createdAtEpoch)}</span>
                          <span className="text-xs text-gray-400">{getRelativeTime(campaign.createdAtEpoch)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={`/campaigns/${campaign.id}/analytics`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs bg-white hover:bg-primary hover:text-white border-gray-200"
                            >
                              <BarChart3 className="w-3.5 h-3.5 mr-1" />
                              Analytics
                            </Button>
                          </Link>
                          
                          {/* Dropdown menu for additional actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs bg-white hover:bg-blue-600 hover:text-white border-gray-200"
                              >
                                <MoreVertical className="w-3.5 h-3.5 mr-1" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <Link to={`/campaign/view/${campaign.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="w-3.5 h-3.5 mr-2" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                disabled={actionInProgress === campaign.id}
                                onClick={() => {
                                  const newState = campaign.state === CampaignState.PAUSED 
                                    ? CampaignState.RUNNING 
                                    : CampaignState.MANUALPAUSED;

                                
                                  handleCampaignStatusChange(campaign.id, newState);
                                  //console.log(`Toggling campaign ${campaign.id} to ${newState}`);
                                }}
                              >
                                {actionInProgress === campaign.id ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                ) : campaign.state === CampaignState.PAUSED ? (
                                  <Play className="w-3.5 h-3.5 mr-2" />
                                ) : (
                                  <Pause className="w-3.5 h-3.5 mr-2" />
                                )}
                                <span>
                                  {campaign.state === CampaignState.PAUSED ? 'Resume Campaign' : 'Pause Campaign'}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                disabled={actionInProgress === campaign.id}
                                onClick={() => handleCampaignStatusChange(campaign.id, CampaignState.STOPPED)}
                              >
                                {actionInProgress === campaign.id ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                ) : (
                                  <StopCircle className="w-3.5 h-3.5 mr-2" />
                                )}
                                <span>Stop Campaign</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component wrapping the content in the layout
const CampaignsList = () => {
  return (
    <DashboardLayout activePage="campaigns">
      <CampaignsListContent />
    </DashboardLayout>
  );
};

export default CampaignsList;
