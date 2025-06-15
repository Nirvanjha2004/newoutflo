import React, { useState, useEffect } from 'react';
import { Clock, Users, Mail, Calendar, Settings, Eye, Plus, X, ChevronDown, ChevronUp, Loader2, Lock, BarChart2, AlertCircle, CheckCircle, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Campaign } from '@/types/campaigns';
import { useCampaignStore } from '@/api/store/campaignStore/campaign';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface ReviewLaunchProps {
  campaignData: Partial<Campaign>;
  updateCampaignData: (data: Partial<Campaign>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  viewMode?: boolean; // Added viewMode prop
}

const ReviewLaunch: React.FC<ReviewLaunchProps> = ({ 
  campaignData, 
  updateCampaignData, 
  onSubmit, 
  isSubmitting,
  viewMode = false
}) => {
  // Get campaign data from store - access BOTH parts of the store
  const storeData = useCampaignStore(state => ({
    campaign: state.campaign,
    configs: state.configs // Add this line to access configs directly
  }));
  
  console.log('Store Data in ReviewLaunch:', storeData);
  console.log("Campaign Data from props:", campaignData);
  
  // IMPORTANT: Extract all the actions you need from the store
  const { setWorkingHours, setOperationalTimes } = useCampaignStore();
  
  // Initialize with default working hours
  const defaultWorkingHours = {
    Sunday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
    Monday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Tuesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Wednesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Thursday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Friday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Saturday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
  };
  
  // Use campaignData's workingHours if available, otherwise use defaults
  const [workingHours, setWorkingHoursState] = useState(
    campaignData?.workingHours || defaultWorkingHours
  );

  const [timezone, setTimezone] = useState("Target's Timezone (Recommended)");
  const [confirmDetails, setConfirmDetails] = useState(false);

  // Collapsible states - always open in view mode
  const [isLeadListOpen, setIsLeadListOpen] = useState(viewMode);
  const [isSendersOpen, setIsSendersOpen] = useState(viewMode);
  const [isSequenceOpen, setIsSequenceOpen] = useState(viewMode);
  const [isScheduleOpen, setIsScheduleOpen] = useState(viewMode);

  // Get workingHours and timezone from campaignData if available
  useEffect(() => {
    // Update working hours when campaign data changes
    if (campaignData?.workingHours) {
      setWorkingHoursState(campaignData.workingHours);
      // Also update the store
      setWorkingHours(campaignData.workingHours);
    }
    
    if (campaignData?.timezone) {
      setTimezone(campaignData.timezone);
    }
    
    // In view mode, ensure all sections are open
    if (viewMode) {
      setIsLeadListOpen(true);
      setIsSendersOpen(true);
      setIsSequenceOpen(true);
      setIsScheduleOpen(true);
    }
  }, [campaignData, viewMode, setWorkingHours]);

  // Improved data extraction based on the actual store structure
  // For lead data - directly access from the store
  const leadCount = Array.isArray(campaignData?.leads)
    ? campaignData.leads.length
    : campaignData?.leads?.data?.length || 
      storeData?.campaign.leads?.data?.length || 
      0;
  
  const leadListName = storeData?.campaign.leads?.fileName || 
                      campaignData?.leads?.fileName ||
                      (campaignData?.name ? `${campaignData.name} List` : 'Lead List');
  
  // For sender accounts - corrected accessor
  const extractSenderAccounts = () => {
    // Check for nested arrays in senderAccounts or accounts
    if (Array.isArray(campaignData?.senderAccounts)) {
      // Handle nested array structure
      if (campaignData.senderAccounts.length > 0 && Array.isArray(campaignData.senderAccounts[0])) {
        return campaignData.senderAccounts.flat();
      }
      return campaignData.senderAccounts;
    } 
    
    if (Array.isArray(campaignData?.accounts)) {
      // Handle nested array structure
      if (campaignData.accounts.length > 0 && Array.isArray(campaignData.accounts[0])) {
        return campaignData.accounts.flat();
      }
      return campaignData.accounts;
    }
    
    // Try to get accounts from store if available
    if (storeData?.campaign?.senderAccounts) {
      return storeData.campaign.senderAccounts;
    }
    
    // Check if we have accountIDs that we can use
    if (Array.isArray(campaignData?.accountIDs) && campaignData.accountIDs.length > 0) {
      // Return basic placeholder accounts using IDs
      return campaignData.accountIDs.map(id => ({
        id,
        firstName: "LinkedIn",
        lastName: "Account",
        email: `account-${id.substring(0, 6)}`
      }));
    }
    
    return [];
  };

  // Use the extracted accounts
  const senderAccounts = extractSenderAccounts();

  // Parse workflow steps for display - prioritize store data
  const getWorkflowSteps = () => {
    console.log("Getting workflow steps, viewMode:", viewMode);
    console.log("Store data workflow:", storeData.campaign.configs);
    console.log("Campaign data workflow:", campaignData?.workflow);
    
    // VIEW MODE: Prioritize campaignData.workflow.configs
    if (viewMode) {
      if (campaignData?.workflow?.configs?.length) {
        return campaignData.workflow.configs.map((config: any, index: number) => {
          if (config.action === "sendConnectionRequest") {
            return {
              type: 'connection',
              title: 'Connection Request',
              subtitle: 'Initial outreach message',
              content: config.data?.text || ''
            };
          } else if (config.action === "sendFollowUp") {
            // Get delay value - convert to days for display
            const delayMs = config.data?.delay || 0;
            // Convert milliseconds to days
            const delayDays = Math.floor(delayMs / (24 * 60 * 60 * 1000));

            return {
              type: 'followup',
              title: `Follow-Up ${index}`,
              subtitle: `${delayDays} ${delayDays === 1 ? 'day' : 'days'} later`,
              content: config.data?.text || ''
            };
          }
          return null;
        }).filter(Boolean);
      }
    } 
    // CREATION MODE: First check the configs array directly in the store
    // This matches the format seen in the console log
    else {
      if (storeData.campaign.configs && storeData.campaign.configs.length > 0) {
        console.log("Using workflow data from store.configs:", storeData.campaign.configs);
        return storeData.campaign.configs.map((config: any, index: number) => {
          if (config.action === "sendConnectionRequest") {
            return {
              type: 'connection',
              title: 'Connection Request',
              subtitle: 'Initial outreach message',
              content: config.data?.text || ''
            };
          } else if (config.action === "sendFollowUp") {
            // Get delay value - convert to days for display
            const delaySeconds = config.data?.delay || 0;
            // Convert seconds to days (86400 seconds = 1 day)
            const delayDays = Math.floor(delaySeconds / (24 * 60 * 60));
            
            return {
              type: 'followup',
              title: `Follow-Up ${index}`,
              subtitle: `${delayDays} ${delayDays === 1 ? 'day' : 'days'} later`,
              content: config.data?.text || ''
            };
          }
          return null;
        }).filter(Boolean);
      }
      
      // Fallback to campaignData.workflow.configs if store doesn't have data
      if (campaignData?.workflow?.configs?.length) {
        return campaignData.workflow.configs.map((config: any, index: number) => {
          if (config.action === "sendConnectionRequest") {
            return {
              type: 'connection',
              title: 'Connection Request',
              subtitle: 'Initial outreach message', 
              content: config.data?.text || ''
            };
          } else if (config.action === "sendFollowUp") {
            const delayMs = config.data?.delay || 0;
            const delayDays = Math.floor(delayMs / (24 * 60 * 60 * 1000));
            return {
              type: 'followup',
              title: `Follow-Up ${index}`,
              subtitle: `${delayDays} ${delayDays === 1 ? 'day' : 'days'} later`,
              content: config.data?.text || ''
            };
          }
          return null;
        }).filter(Boolean);
      }
      
      // Also check for steps format directly in campaignData
      if (campaignData?.workflow?.steps?.length) {
        return campaignData.workflow.steps.map((step: any, index: number) => {
          if (step.type === 'CONNECTION_REQUEST') {
            return {
              type: 'connection',
              title: 'Connection Request',
              subtitle: 'Initial outreach message',
              content: step.data?.message || ''
            };
          } else if (step.type === 'FOLLOW_UP') {
            const delaySeconds = step.data?.delay || 0;
            const delayDays = Math.floor(delaySeconds / (24 * 60 * 60));
            return {
              type: 'followup',
              title: `Follow-Up ${index}`,
              subtitle: `${delayDays} ${delayDays === 1 ? 'day' : 'days'} later`,
              content: step.data?.message || ''
            };
          }
          return null;
        }).filter(Boolean);
      }
    }
    
    // Default steps if nothing available
    return [];
  };
  
  const workflowSteps = getWorkflowSteps();

  // Update working hours in both state and store - skip in view mode
  const toggleDay = (day: string) => {
    if (viewMode) return; // Skip in view mode
    
    const updatedHours = {
      ...workingHours,
      [day]: { ...workingHours[day as keyof typeof workingHours], enabled: !workingHours[day as keyof typeof workingHours].enabled }
    };
    
    setWorkingHoursState(updatedHours);
    updateCampaignData({ workingHours: updatedHours });
    setWorkingHours(updatedHours);
  };

  const updateTimeSlot = (day: string, slotIndex: number, field: 'from' | 'to', value: string) => {
    if (viewMode) return; // Skip in view mode
    
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day as keyof typeof workingHours],
        slots: workingHours[day as keyof typeof workingHours].slots.map((slot, index) => 
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    };
    
    setWorkingHoursState(updatedHours);
    updateCampaignData({ workingHours: updatedHours });
    setWorkingHours(updatedHours);
  };

  const addTimeSlot = (day: string) => {
    if (viewMode) return; // Skip in view mode
    
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day as keyof typeof workingHours],
        slots: [...workingHours[day as keyof typeof workingHours].slots, { from: '09:00', to: '17:00' }]
      }
    };
    
    setWorkingHoursState(updatedHours);
    updateCampaignData({ workingHours: updatedHours });
    setWorkingHours(updatedHours);
  };

  const applyToAllDays = (day: string) => {
    if (viewMode) return; // Skip in view mode
    
    const template = workingHours[day as keyof typeof workingHours];
    const newHours = Object.fromEntries(
      Object.keys(workingHours).map(dayKey => [
        dayKey, 
        { ...template }
      ])
    ) as typeof workingHours;
    
    setWorkingHoursState(newHours);
    updateCampaignData({ workingHours: newHours });
    setWorkingHours(newHours);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (viewMode) return; // Skip in view mode
    
    const newTimezone = e.target.value;
    setTimezone(newTimezone);
    updateCampaignData({ timezone: newTimezone });
    
    if (setOperationalTimes) {
      setOperationalTimes({
        ...storeData.operationalTimes,
        timezone: newTimezone
      });
    }
  };

  const handleLaunch = () => {
    if (viewMode) return; // Skip in view mode
    
    if (confirmDetails && !isSubmitting) {
      // Generate operational times for API
      const operationalTimes = {};
      
      Object.entries(workingHours).forEach(([dayName, config]) => {
        const dayLower = dayName.toLowerCase();
        if (config.enabled && config.slots.length > 0) {
          // Convert HH:MM to seconds for API
          const startHour = parseInt(config.slots[0].from.split(':')[0]);
          const startMinute = parseInt(config.slots[0].from.split(':')[1]);
          const endHour = parseInt(config.slots[0].to.split(':')[0]);
          const endMinute = parseInt(config.slots[0].to.split(':')[1]);
          
          const startTime = (startHour * 3600) + (startMinute * 60);
          const endTime = (endHour * 3600) + (endMinute * 60);
          
          operationalTimes[dayLower] = {
            startTime,
            endTime,
            enabled: true
          };
        } else {
          operationalTimes[dayLower] = {
            startTime: 9 * 3600, // 9 AM in seconds
            endTime: 17 * 3600,  // 5 PM in seconds
            enabled: false
          };
        }
      });

      console.log("Setting operational times:", operationalTimes);
      
      if (setOperationalTimes) {
        setOperationalTimes(operationalTimes);
      }
      
      // onSubmit();
    }
  };

  // Render the campaign status badge based on current campaign state
  const renderCampaignStatus = () => {
      const state = campaignData?.state;
  let status = 'draft';
  
  // Handle either string or enum type safely
  if (typeof state === 'string') {
    status = state.toLowerCase();
  } else if (state !== undefined) {
    // If it's an enum, convert to string
    status = String(state).toLowerCase();
  }

  const statusMap = {
    processing: { label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-200" },
    active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200" },
    paused: { label: "Paused", className: "bg-amber-100 text-amber-800 border-amber-200" },
    completed: { label: "Completed", className: "bg-blue-100 text-blue-800 border-blue-200" },
    stopped: { label: "Stopped", className: "bg-gray-100 text-gray-800 border-gray-200" },
    draft: { label: "Draft", className: "bg-purple-100 text-purple-800 border-purple-200" },
    failed: { label: "Failed", className: "bg-red-100 text-red-800 border-red-200" },
    running: { label: "Running", className: "bg-green-100 text-green-800 border-green-200" }
  };
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
  
  return (
    <Badge className={`${statusInfo.className} ml-2`}>
      {statusInfo.label}
    </Badge>
  );
};

  // Add function to safely handle different date formats
  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return 'N/A';
    
    try {
      const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      // Handle both Unix timestamps (seconds) and JavaScript timestamps (milliseconds)
      const dateObj = new Date(numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp);
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get campaign performance metrics for view mode
  const getCampaignMetrics = () => {
    // From campaign stats if available
    const stats = campaignData?.stats || {};
    
    return [
      {
        title: "Connection Requests",
        value: stats.connectionsSent || 0,
        icon: Users,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600"
      },
      {
        title: "Accepted",
        value: stats.connectionsAccepted || 0,
        icon: CheckCircle,
        bgColor: "bg-green-50",
        textColor: "text-green-600"
      },
      {
        title: "Messages Sent",
        value: stats.messagesSent || 0,
        icon: MessageCircle,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600"
      },
      {
        title: "Responses",
        value: stats.messagesReceived || 0,
        icon: ArrowLeft,
        bgColor: "bg-purple-50",
        textColor: "text-purple-600"
      }
    ];
  };

  return (
    <div className="space-y-8">
      {/* View Mode Banner - Enhanced with more campaign details */}
      {viewMode && (
        <Alert className="bg-blue-50 border-blue-200 shadow-sm">
          <div className="flex items-center">
            <Lock className="w-4 h-4 mr-2 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center">
                <AlertDescription className="text-blue-800 font-medium">
                  Campaign Details (View Only)
                </AlertDescription>
                {renderCampaignStatus()}
              </div>
              <div className="mt-1.5 text-sm text-blue-700">
                <div className="flex items-center flex-wrap gap-x-4">
                  <span>
                    <span className="font-medium">Name:</span> {campaignData?.name || 'Unnamed Campaign'}
                  </span>
                  {campaignData?.id && (
                    <span className="text-blue-600">
                      <span className="font-medium">ID:</span> {campaignData.id}
                    </span>
                  )}
                  {campaignData?.createdAt && (
                    <span className="text-blue-600">
                      <span className="font-medium">Created:</span> {formatDate(campaignData.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Lead List Summary */}
      <Collapsible 
        open={isLeadListOpen} 
        onOpenChange={(isOpen) => !viewMode && setIsLeadListOpen(isOpen)}
        disabled={viewMode}
      >
        <Card className={`bg-white shadow-sm border ${viewMode ? 'border-gray-100' : 'border-gray-200'}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className={`pb-4 ${!viewMode ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors ${viewMode ? 'bg-gray-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode ? 'bg-blue-50' : 'bg-primary/10'}`}>
                    <Users className={`w-5 h-5 ${viewMode ? 'text-blue-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Lead List</CardTitle>
                    {viewMode && (
                      <p className="text-sm text-gray-500 mt-1">
                        Target audience for this campaign
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!viewMode && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <span>|</span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Replace List
                      </Button>
                    </div>
                  )}
                  {viewMode ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      View Only
                    </Badge>
                  ) : (
                    isLeadListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {leadCount > 0 ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{leadListName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {viewMode 
                        ? "Lead list used in this campaign" 
                        : "Selected lead list for this campaign"}
                    </p>
                  </div>
                  <Badge variant={viewMode ? "outline" : "secondary"} className={viewMode 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "bg-primary/10 text-primary border-primary/20"}>
                    {leadCount} Leads
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No lead list selected. {!viewMode && "Please go back and upload a CSV file."}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sender Accounts Summary - Enhanced styling in view mode */}
      <Collapsible 
        open={isSendersOpen} 
        onOpenChange={(isOpen) => !viewMode && setIsSendersOpen(isOpen)}
        disabled={viewMode}
      >
        <Card className={`bg-white shadow-sm border ${viewMode ? 'border-gray-100' : 'border-gray-200'}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className={`pb-4 ${!viewMode ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors ${viewMode ? 'bg-gray-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode ? 'bg-blue-50' : 'bg-primary/10'}`}>
                    <Mail className={`w-5 h-5 ${viewMode ? 'text-blue-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Sender Accounts</CardTitle>
                    {viewMode && (
                      <p className="text-sm text-gray-500 mt-1">
                        LinkedIn accounts used to send messages
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {viewMode ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Read Only
                    </Badge>
                  ) : (
                    isSendersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {senderAccounts && senderAccounts.length > 0 ? (
                <div className="flex flex-wrap items-center gap-4">
                  {senderAccounts.map((account: any, index: number) => {
                    // Get account status if available
                    const accountStatus = campaignData?.accountStatuses?.[account.id];
                    
                    return (
                      <div 
                        key={account.id || `account-${index}`} 
                        className={`flex items-center space-x-3 rounded-lg p-3 ${
                          viewMode ? 'bg-blue-50/30 border border-blue-100' : 'bg-gray-50'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={account.profilePicture || "/placeholder.svg"} />
                          <AvatarFallback>{(account.firstName?.[0] || '') + (account.lastName?.[0] || '')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {account.firstName || ''} {account.lastName || ''}
                            </p>
                            {accountStatus && (
                              <Badge className={
                                accountStatus.connected ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              } variant="outline" size="sm">
                                {accountStatus.connected ? "Connected" : "Pending"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{account.email || account.id?.substring(0, 10)}</p>
                        </div>
                        {!viewMode && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 h-auto"
                            onClick={() => {
                              const updatedAccounts = senderAccounts.filter(a => a.id !== account.id);
                              updateCampaignData({ accounts: updatedAccounts });
                            }}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No sender accounts selected. {!viewMode && "Please go back and select LinkedIn accounts."}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sequence Overview - Enhanced message display in view mode */}
      <Collapsible 
        open={isSequenceOpen} 
        onOpenChange={(isOpen) => !viewMode && setIsSequenceOpen(isOpen)}
        disabled={viewMode}
      >
        <Card className={`bg-white shadow-sm border ${viewMode ? 'border-gray-100' : 'border-gray-200'}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className={`pb-4 ${!viewMode ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors ${viewMode ? 'bg-gray-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode ? 'bg-blue-50' : 'bg-primary/10'}`}>
                    <Settings className={`w-5 h-5 ${viewMode ? 'text-blue-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Campaign Sequence</CardTitle>
                    {viewMode && (
                      <p className="text-sm text-gray-500 mt-1">
                        Message sequence and automation flow
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!viewMode && (
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      Edit Sequence
                    </Button>
                  )}
                  {viewMode ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      View Only
                    </Badge>
                  ) : (
                    isSequenceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {workflowSteps && workflowSteps.length > 0 ? (
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className={`flex flex-col p-4 rounded-lg ${
                      viewMode
                        ? step.type === 'connection' 
                          ? 'bg-indigo-50/40 border border-indigo-100'
                          : 'bg-blue-50/40 border border-blue-100' 
                        : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-4 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          viewMode 
                            ? step.type === 'connection'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                            : 'bg-primary text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{step.title}</h4>
                          <p className="text-sm text-gray-500">{step.subtitle}</p>
                        </div>
                        {step.type === 'connection' ? 
                          <Mail className={`w-4 h-4 ${viewMode ? 'text-indigo-500' : 'text-gray-400'}`} /> : 
                          <Clock className={`w-4 h-4 ${viewMode ? 'text-blue-500' : 'text-gray-400'}`} />
                        }
                      </div>
                      
                      {/* Always show message content, but with different styling based on mode */}
                      {step.content && (
                        <div className={`mt-2 p-3 rounded text-sm whitespace-pre-wrap ${
                          viewMode
                            ? step.type === 'connection'
                              ? 'bg-white border border-indigo-100 text-gray-700'
                              : 'bg-white border border-blue-100 text-gray-700'
                            : 'bg-white/80 border border-gray-200 text-gray-700'
                        }`}>
                          {step.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No campaign sequence configured. {!viewMode && "Please go back and set up your campaign sequence."}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Schedule Campaign - Enhanced readability in view mode */}
      <Collapsible 
        open={isScheduleOpen} 
        onOpenChange={(isOpen) => !viewMode && setIsScheduleOpen(isOpen)}
        disabled={viewMode}
      >
        <Card className={`bg-white shadow-sm border ${viewMode ? 'border-gray-100' : 'border-gray-200'}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className={`pb-4 ${!viewMode ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors ${viewMode ? 'bg-gray-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode ? 'bg-blue-50' : 'bg-primary/10'}`}>
                    <Calendar className={`w-5 h-5 ${viewMode ? 'text-blue-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Campaign Schedule</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {viewMode 
                        ? "Times when audience receives deliveries from this campaign" 
                        : "Set the times your audience should receive deliveries from this campaign"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {viewMode ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Schedule
                    </Badge>
                  ) : (
                    isScheduleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Timezone display - enhanced for view mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  {viewMode ? (
                    <div className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      {timezone}
                    </div>
                  ) : (
                    <>
                      <select 
                        value={timezone}
                        onChange={handleTimezoneChange}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none pr-10"
                        disabled={viewMode}
                      >
                        <option>Target's Timezone (Recommended)</option>
                        <option>UTC</option>
                        <option>EST</option>
                        <option>PST</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </>
                  )}
                </div>
              </div>

              {/* Working Hours Grid - improved view mode display */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Working Hours</h4>
                  {viewMode && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">Read Only</Badge>
                  )}
                </div>
                
                <div className={`space-y-3 ${viewMode ? 'border border-blue-100 rounded-lg p-3 bg-blue-50/20' : ''}`}>
                  {Object.entries(workingHours).map(([day, config]) => (
                    <div key={day} className={`flex items-center space-x-4 p-3 border ${viewMode ? 'border-blue-100 bg-white' : 'border-gray-200'} rounded-lg`}>
                      <div className="flex items-center space-x-3 w-24">
                        {viewMode ? (
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${config.enabled 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'bg-gray-200 border-gray-300'}`}>
                            {config.enabled && <Check className="w-3 h-3" />}
                          </div>
                        ) : (
                          <Checkbox
                            checked={config.enabled}
                            onCheckedChange={(checked) => {
                              if (checked !== 'indeterminate' && !viewMode) {
                                toggleDay(day);
                              }
                            }}
                            disabled={viewMode}
                          />
                        )}
                        <span className={`text-sm font-medium ${config.enabled ? 'text-gray-700' : 'text-gray-500'}`}>{day}</span>
                      </div>
                      
                      <div className="flex-1 flex items-center space-x-2">
                        {config.slots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            {viewMode ? (
                              <span className={`px-2 py-1 border ${config.enabled 
                                ? 'border-blue-200 bg-blue-50/50 text-blue-700' 
                                : 'border-gray-200 bg-gray-50 text-gray-400'} rounded text-sm`}>
                                {slot.from}
                              </span>
                            ) : (
                              <input
                                type="time"
                                value={slot.from}
                                onChange={(e) => updateTimeSlot(day, index, 'from', e.target.value)}
                                disabled={!config.enabled || viewMode}
                                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                              />
                            )}
                            <span className="text-gray-500">to</span>
                            {viewMode ? (
                              <span className={`px-2 py-1 border ${config.enabled 
                                ? 'border-blue-200 bg-blue-50/50 text-blue-700' 
                                : 'border-gray-200 bg-gray-50 text-gray-400'} rounded text-sm`}>
                                {slot.to}
                              </span>
                            ) : (
                              <input
                                type="time"
                                value={slot.to}
                                onChange={(e) => updateTimeSlot(day, index, 'to', e.target.value)}
                                disabled={!config.enabled || viewMode}
                                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                              />
                            )}
                          </div>
                        ))}
                        
                        {!viewMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addTimeSlot(day)}
                            disabled={!config.enabled || viewMode}
                            className="p-1 h-auto"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {!viewMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyToAllDays(day)}
                          disabled={!config.enabled || viewMode}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          Apply to all
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Launch Button - Only show in edit mode */}
      {!viewMode && (
        <div className="bg-white border-t border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={confirmDetails}
                onCheckedChange={(checked) => {
                  if (checked !== 'indeterminate') {
                    setConfirmDetails(!!checked);
                  }
                }}
              />
              <label className="text-sm text-gray-600">
                I confirm all details are correct and ready to launch
              </label>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-semibold relative"
              disabled={!confirmDetails || isSubmitting}
              onClick={handleLaunch}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Launching Campaign...
                </>
              ) : (
                <>🚀 Save Time</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Campaign Statistics - Improved display in view mode */}
      {viewMode && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Campaign Performance</CardTitle>
                  <CardDescription>
                    Statistics and metrics for this campaign
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                Statistics
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {campaignData?.stats ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2">
                      <Users className="w-4 h-4 text-blue-500 mr-2" />
                      <p className="text-sm font-medium text-blue-700">Connection Requests</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {campaignData?.stats?.connectionsSent || 0}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">Total sent</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <p className="text-sm font-medium text-green-700">Accepted</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {campaignData?.stats?.connectionsAccepted || 0}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {campaignData?.stats?.connectionsSent 
                        ? Math.round((campaignData?.stats?.connectionsAccepted / campaignData?.stats?.connectionsSent) * 100) + '%'
                        : '0%'} acceptance rate
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center mb-2">
                      <MessageCircle className="w-4 h-4 text-purple-500 mr-2" />
                      <p className="text-sm font-medium text-purple-700">Messages Sent</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {campaignData?.stats?.messagesSent || 0}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">Total messages</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-center mb-2">
                      <ArrowLeft className="w-4 h-4 text-indigo-500 mr-2" />
                      <p className="text-sm font-medium text-indigo-700">Responses</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {campaignData?.stats?.messagesReceived || 0}
                    </p>
                    <p className="text-xs text-indigo-500 mt-1">
                      {campaignData?.stats?.messagesSent 
                        ? Math.round((campaignData?.stats?.messagesReceived / campaignData?.stats?.messagesSent) * 100) + '%'
                        : '0%'} response rate
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-4 py-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No performance data available</h3>
                  <p className="text-gray-500 mt-2">This campaign doesn't have any performance statistics yet.</p>
                </div>
              )}
            </div>

            {/* Campaign timeline if available */}
            {viewMode && campaignData?.timeline && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Timeline</h3>
                <div className="space-y-3">
                  {campaignData.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{event.action}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewLaunch;