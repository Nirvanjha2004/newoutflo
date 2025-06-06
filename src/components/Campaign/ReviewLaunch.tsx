import React, { useState, useEffect } from 'react';
import { Clock, Users, Mail, Calendar, Settings, Eye, Plus, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Campaign } from '@/types/campaigns';
import { useCampaignStore } from '@/api/store/campaignStore/campaign'; // Import campaign store

interface ReviewLaunchProps {
  campaignData: Partial<Campaign>;
  updateCampaignData: (data: Partial<Campaign>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ReviewLaunch: React.FC<ReviewLaunchProps> = ({ campaignData, updateCampaignData, onSubmit, isSubmitting }) => {
  // Get campaign data from store
  const storeData = useCampaignStore(state => state.campaign);
  
  // IMPORTANT: Extract all the actions you need from the store
  const { setWorkingHours, setOperationalTimes } = useCampaignStore();
  
  // Add console logging to debug store data
  useEffect(() => {
    console.log("ReviewLaunch - Store data:", storeData);
    console.log("ReviewLaunch - Campaign data from props:", campaignData);
  }, [storeData, campaignData]);
  
  // Initialize state from store/campaignData if available, otherwise use defaults
  const [workingHours, setWorkingHoursState] = useState({
    Sunday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
    Monday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Tuesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Wednesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Thursday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Friday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
    Saturday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
  });

  const [timezone, setTimezone] = useState("Target's Timezone (Recommended)");
  const [confirmDetails, setConfirmDetails] = useState(false);

  // Collapsible states
  const [isLeadListOpen, setIsLeadListOpen] = useState(true);
  const [isSendersOpen, setIsSendersOpen] = useState(true);
  const [isSequenceOpen, setIsSequenceOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);

  // Improved data extraction based on the actual store structure
  // For lead data - directly access from the store
  const leadCount = storeData?.campaign.leads?.rowCount || 
                   storeData?.campaign.leads?.data?.length || 
                   campaignData?.leads?.data?.length || 
                   campaignData?.leads?.length || 
                   0;
  
  const leadListName = storeData?.campaign.leads?.fileName || 
                      campaignData?.leads?.fileName ||
                      (campaignData?.name ? `${campaignData.name} List` : 'Lead List');
  
  // For sender accounts - corrected accessor
  const senderAccounts = storeData?.campaign.senderAccounts || campaignData?.campaign.accounts || [];

  // Parse workflow steps for display - prioritize store data
  const getWorkflowSteps = () => {
    // First check for configs in the store
    if (storeData?.campaign.configs?.length) {
      console.log("Using configs from store:", storeData.campaign.configs);
      
      return storeData.campaign.configs.map((config: any, index: number) => {
        if (config.action === "sendConnectionRequest") {
          return {
            type: 'connection',
            title: 'Connection Request',
            subtitle: 'Initial outreach message',
            content: config.data?.text || ''
          };
        } else if (config.action === "sendFollowUp") {
          const delayDays = Math.floor((config.data?.delay || 0) / (24 * 60 * 60));
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
    
    // If no configs but we have workflow steps in the store
    if (storeData?.campaign.workflow?.steps?.length) {
      console.log("Using workflow steps from store:", storeData.campaign.workflow.steps);
      
      return storeData.campaign.workflow.steps.map((step: any, index: number) => {
        if (step.type === 'CONNECTION_REQUEST') {
          return {
            type: 'connection',
            title: 'Connection Request',
            subtitle: 'Initial outreach message',
            content: step.data?.message || ''
          };
        } else if (step.type === 'FOLLOW_UP') {
          const delayDays = Math.floor((step.data?.delay || 0) / (24 * 60 * 60));
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
    
    // Fallback to campaign data props
    if (campaignData?.workflow?.configs?.length) {
      console.log("Using configs from campaign data props:", campaignData.workflow.configs);
      
      return campaignData.workflow.configs.map((config: any, index: number) => {
        if (config.action === "sendConnectionRequest") {
          return {
            type: 'connection',
            title: 'Connection Request',
            subtitle: 'Initial outreach message',
            content: config.data?.text || ''
          };
        } else if (config.action === "sendFollowUp") {
          const delayDays = Math.floor((config.data?.delay || 0) / (24 * 60 * 60));
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
    
    // Default steps if nothing available
    console.log("ReviewLaunch - Using default workflow steps");
    return [
      { type: 'connection', title: 'Connection Request', subtitle: 'Initial outreach message', content: '' },
      { type: 'followup', title: 'Follow-Up 1', subtitle: '1 day later', content: 'Hi {first_name},\nThanks for connecting!' }
    ];
  };
  
  const workflowSteps = getWorkflowSteps();
  console.log("ReviewLaunch - Final workflow steps:", workflowSteps);
  console.log("ReviewLaunch - Lead data:", { leadCount, leadListName });
  console.log("ReviewLaunch - Sender accounts:", senderAccounts);

  // Update working hours in both state and store
  const toggleDay = (day: string) => {
    const updatedHours = {
      ...workingHours,
      [day]: { ...workingHours[day as keyof typeof workingHours], enabled: !workingHours[day as keyof typeof workingHours].enabled }
    };
    
    setWorkingHoursState(updatedHours);
    updateCampaignData({ workingHours: updatedHours }); // For backward compatibility
    
    // Update store
    setWorkingHours(updatedHours);
    console.log('Working hours updated in store:', updatedHours);
  };

  const updateTimeSlot = (day: string, slotIndex: number, field: 'from' | 'to', value: string) => {
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
    updateCampaignData({ workingHours: updatedHours }); // For backward compatibility
    
    // Update store
    setWorkingHours(updatedHours);
    console.log('Working hours slot updated in store:', { day, slot: slotIndex, [field]: value });
  };

  const addTimeSlot = (day: string) => {
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day as keyof typeof workingHours],
        slots: [...workingHours[day as keyof typeof workingHours].slots, { from: '09:00', to: '17:00' }]
      }
    };
    
    setWorkingHoursState(updatedHours);
    updateCampaignData({ workingHours: updatedHours }); // For backward compatibility
    
    // Update store
    setWorkingHours(updatedHours);
    console.log('Added new working hours slot to store:', { day });
  };

  const applyToAllDays = (day: string) => {
    const template = workingHours[day as keyof typeof workingHours];
    const newHours = Object.fromEntries(
      Object.keys(workingHours).map(dayKey => [
        dayKey, 
        { ...template }
      ])
    ) as typeof workingHours;
    
    setWorkingHoursState(newHours);
    updateCampaignData({ workingHours: newHours }); // For backward compatibility
    
    // Update store
    setWorkingHours(newHours);
    console.log('Applied working hours to all days in store');
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setTimezone(newTimezone);
    updateCampaignData({ timezone: newTimezone });
    
    // FIX: Use the action from the store
    if (setOperationalTimes) {
      setOperationalTimes({
        ...storeData.operationalTimes,
        timezone: newTimezone
      });
    }
  };

  const handleLaunch = () => {
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
      
      // FIX: Use the action from the store instead of setState
      if (setOperationalTimes) {
        setOperationalTimes(operationalTimes);
        console.log('Generated operational times for API:', operationalTimes);
      }
      
      onSubmit();
    }
  };

  return (
    <div className="space-y-8">
      {/* Lead List Summary */}
      <Collapsible open={isLeadListOpen} onOpenChange={setIsLeadListOpen}>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Lead List</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
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
                  {isLeadListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                    <p className="text-sm text-gray-500 mt-1">Selected lead list for this campaign</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {leadCount} Leads
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No lead list selected. Please go back and upload a CSV file.</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sender Accounts Summary */}
      <Collapsible open={isSendersOpen} onOpenChange={setIsSendersOpen}>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Sender Accounts</CardTitle>
                </div>
                {isSendersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {senderAccounts && senderAccounts.length > 0 ? (
                <div className="flex flex-wrap items-center gap-4">
                  {senderAccounts.map((account: any, index: number) => (
                    <div key={account.id || `account-${index}`} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={account.profilePicture || "/placeholder.svg"} />
                        <AvatarFallback>{account.firstName?.[0]}{account.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{account.firstName} {account.lastName}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No sender accounts selected. Please go back and select LinkedIn accounts.</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sequence Overview */}
      <Collapsible open={isSequenceOpen} onOpenChange={setIsSequenceOpen}>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Campaign Sequence</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Edit Sequence
                  </Button>
                  {isSequenceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {workflowSteps && workflowSteps.length > 0 ? (
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-500">{step.subtitle}</p>
                      </div>
                      {step.type === 'connection' ? 
                        <Mail className="w-4 h-4 text-gray-400" /> : 
                        <Clock className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No campaign sequence configured. Please go back and set up your campaign sequence.</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Schedule Campaign */}
      <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-semibold">Campaign Schedule</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Set the times your audience should receive deliveries from this campaign</p>
                  </div>
                </div>
                {isScheduleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Timezone Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  <select 
                    value={timezone}
                    onChange={handleTimezoneChange}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none pr-10"
                  >
                    <option>Target's Timezone (Recommended)</option>
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Working Hours Grid */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Working Hours</h4>
                <div className="space-y-3">
                  {Object.entries(workingHours).map(([day, config]) => (
                    <div key={day} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 w-24">
                        <Checkbox
                          checked={config.enabled}
                          onCheckedChange={(checked) => {
                            if (checked !== 'indeterminate') {
                              toggleDay(day);
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">{day}</span>
                      </div>
                      
                      <div className="flex-1 flex items-center space-x-2">
                        {config.slots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={slot.from}
                              onChange={(e) => updateTimeSlot(day, index, 'from', e.target.value)}
                              disabled={!config.enabled}
                              className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={slot.to}
                              onChange={(e) => updateTimeSlot(day, index, 'to', e.target.value)}
                              disabled={!config.enabled}
                              className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                            />
                          </div>
                        ))}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addTimeSlot(day)}
                          disabled={!config.enabled}
                          className="p-1 h-auto"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyToAllDays(day)}
                        disabled={!config.enabled}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Apply to all
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Launch Button */}
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
              <>🚀 Launch Campaign</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewLaunch;
