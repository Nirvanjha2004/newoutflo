import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, Lock, Eye, Play, Pause, Edit, ExternalLink, ChevronDown, BarChart2, Check, MessageCircle, ArrowLeftCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CampaignBreadcrumb from '@/components/Campaign/CampaignBreadcrumb';
import LinkedInSenders from '@/components/Campaign/LinkedInSenders';
import ListOfLeads from '@/components/Campaign/ListOfLeads';
import Sequence from '@/components/Campaign/Sequence';
import ReviewLaunch from '@/components/Campaign/ReviewLaunch';
import { usePostCampaign, useUpdateCampaign } from '@/hooks/useCampaignMutations';
import { Campaign, CampaignState } from '@/types/campaigns';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useCampaignByIdQuery, mapBackendCampaignToFrontend } from '@/hooks/useCampaignQueries';
import { useCampaignInsightsQuery } from '@/hooks/useCampaignInsights';
import CampaignAnalytics from './CampaignAnalytics';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Add to ViewCampaignPage.tsx
import { CampaignStepType } from '@/types/campaigns';

// Transform campaign workflow data into the expected format for Sequence component
const transformWorkflowData = (workflow: any[] | undefined) => {
    if (!workflow || !Array.isArray(workflow)) return { steps: [] };

    const steps = workflow.map(item => {
        if (item.action === "sendConnectionRequest") {
            return {
                type: CampaignStepType.CONNECTION_REQUEST,
                data: {
                    message: item.data?.text || ""
                }
            };
        } else if (item.action === "sendFollowUp") {
            // Get delay in milliseconds (or use default)
            const delayMs = item.data?.delay || (2 * 24 * 60 * 60 * 1000); // Default: 2 days

            // Convert milliseconds to seconds for the Sequence component
            // The Sequence component expects seconds and converts to days/hours internally
            const delayInSeconds = Math.floor(delayMs / 1000);

            //console.log(`Converting delay from ${delayMs}ms to ${delayInSeconds}s`);

            return {
                type: CampaignStepType.FOLLOW_UP,
                data: {
                    message: item.data?.text || "",
                    delay: delayInSeconds
                }
            };
        }
        return null;
    }).filter(Boolean);

    //console.log("Transformed workflow steps:", steps);
    return { steps };
};

// Add this helper function to convert seconds to HH:MM format
const secondsToTimeFormat = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Transform campaign data for ReviewLaunch component
const transformCampaignForReview = (campaign: any, insights: any) => {
    //console.log("Transforming workflow data for reviewLaunch component", campaign);

    if (!campaign) return {};

    // Default working hours
    const defaultWorkingHours = {
        Sunday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
        Monday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
        Tuesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
        Wednesday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
        Thursday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
        Friday: { enabled: true, slots: [{ from: '09:00', to: '17:00' }] },
        Saturday: { enabled: false, slots: [{ from: '09:00', to: '17:00' }] },
    };

    // Convert operational times to working hours format
    let workingHours = defaultWorkingHours;

    if (campaign.operationalTimes) {
        workingHours = {
            Sunday: {
                enabled: campaign.operationalTimes.sunday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.sunday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.sunday?.endTime || 61200)
                }]
            },
            Monday: {
                enabled: campaign.operationalTimes.monday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.monday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.monday?.endTime || 61200)
                }]
            },
            Tuesday: {
                enabled: campaign.operationalTimes.tuesday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.tuesday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.tuesday?.endTime || 61200)
                }]
            },
            Wednesday: {
                enabled: campaign.operationalTimes.wednesday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.wednesday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.wednesday?.endTime || 61200)
                }]
            },
            Thursday: {
                enabled: campaign.operationalTimes.thursday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.thursday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.thursday?.endTime || 61200)
                }]
            },
            Friday: {
                enabled: campaign.operationalTimes.friday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.friday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.friday?.endTime || 61200)
                }]
            },
            Saturday: {
                enabled: campaign.operationalTimes.saturday?.enabled || false,
                slots: [{
                    from: secondsToTimeFormat(campaign.operationalTimes.saturday?.startTime || 32400),
                    to: secondsToTimeFormat(campaign.operationalTimes.saturday?.endTime || 61200)
                }]
            }
        };
    }

    // Transform workflow data
    let workflowConfigs = [];

    // Handle the case where campaign.workflow is an array
    if (Array.isArray(campaign.workflow)) {
        workflowConfigs = campaign.workflow.map(item => ({
            action: item.action,
            data: {
                text: item.data?.text || "",
                delay: item.action === "sendFollowUp" ? (item.data?.delay || 86400000) : undefined
            }
        }));
    }
    // Handle case where we have workflow.steps (from transformWorkflowData)
    else if (campaign.workflow?.steps) {
        workflowConfigs = campaign.workflow.steps.map(step => {
            if (step.type === CampaignStepType.CONNECTION_REQUEST) {
                return {
                    action: "sendConnectionRequest",
                    data: {
                        text: step.data?.message || ""
                    }
                };
            } else if (step.type === CampaignStepType.FOLLOW_UP) {
                // Convert seconds back to milliseconds for ReviewLaunch
                const delayMs = (step.data?.delay || 2 * 24 * 60 * 60) * 1000;

                return {
                    action: "sendFollowUp",
                    data: {
                        text: step.data?.message || "",
                        delay: delayMs
                    }
                };
            }
            return null;
        }).filter(Boolean);
    }

    // Build the final campaign data object
    return {
        ...campaign,

        // Ensure workflow is in the expected format
        workflow: { configs: workflowConfigs },

        // Ensure accounts are available under both properties
        senderAccounts: campaign.senderAccounts || campaign.accounts || [],
        accounts: campaign.accounts || campaign.senderAccounts || [],

        // Use the converted working hours
        workingHours: workingHours,
        timezone: campaign.localOperationalTimes.timezone || "Target's Timezone (Recommended)",

    };
};


// Campaign view/create content component
const CampaignViewContent = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const { toast } = useToast();
    const navigate = useNavigate();
    const params = useParams();

    // Check if we're in view mode (determined by URL path)
    const isViewMode = window.location.pathname.includes('/campaign/view/');
    const campaignId = params.id;

    // Campaign data state
    const [campaignData, setCampaignData] = useState<Partial<Campaign> & { state?: CampaignState }>({});

    //console.log("Initial campaign data:", campaignData);

    // Track submission and action states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isPausingCampaign, setIsPausingCampaign] = useState(false);
    const [isResumingCampaign, setIsResumingCampaign] = useState(false);

    // Use the campaign query hook instead of direct API call
    const {
        data: fetchedCampaign,
        isLoading: isCampaignLoading,
        error: campaignError,
        refetch: refetchCampaign
    } = useCampaignByIdQuery(campaignId || '', { enabled: isViewMode && !!campaignId });

    // Use the insights query hook to get campaign metrics

    const {
        data: campaignInsights,
        isLoading: insightsLoading,
        refetch: refreshInsights
    } = useCampaignInsightsQuery(campaignId || '');

    useEffect(() => {
        // Only run when we have a valid campaignId
        if (campaignId) {
            console.log("Fetching campaign insights for:", campaignId);

            // Add a small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                refreshInsights();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [campaignId, refreshInsights]);
    console.log('Campaign ID:', campaignId);
    console.log("Campaign Insights Data in view campaign PAge:", campaignInsights);

    // Initialize campaign mutations
    const { mutate: createCampaign } = usePostCampaign();
    const { mutate: updateCampaign } = useUpdateCampaign();

    // When campaign data is fetched, update the state
    useEffect(() => {

        //console.log("Fetched campaign data:", fetchedCampaign);
        if (isViewMode && fetchedCampaign) {
            // Map backend campaign data to our frontend model
            const transformCampaignData = async () => {
                try {
                    const mappedCampaign = await mapBackendCampaignToFrontend(fetchedCampaign);
                    //console.log("Mapped campaign data is :", mappedCampaign);
                    setCampaignData(mappedCampaign);
                    setIsLoading(false);
                    setLoadError(null);

                    //console.log("Mapped campaign data:", mappedCampaign);
                } catch (error) {
                    console.error("Error transforming campaign data:", error);
                    setLoadError("Failed to process campaign data");
                    setIsLoading(false);
                }
            };

            transformCampaignData();
        }
    }, [fetchedCampaign, isViewMode]);

    // Handle loading state
    useEffect(() => {
        setIsLoading(isCampaignLoading);
    }, [isCampaignLoading]);

    // Handle error state
    useEffect(() => {
        if (campaignError) {
            const errorMessage = campaignError instanceof Error ?
                campaignError.message :
                "Failed to load campaign";

            setLoadError(errorMessage);
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage
            });
        }
    }, [campaignError, toast]);

    // Navigation steps
    const steps = [
        { id: 1, title: 'LinkedIn Senders' },
        { id: 2, title: 'List of Leads' },
        { id: 3, title: 'Sequence' },
        { id: 4, title: 'Review & Launch' }
    ];

    // Modified to allow navigation in view mode
    const handleStepChange = (stepId: number) => {
        setCurrentStep(stepId);
    };

    const handleBack = () => {
        if (isViewMode) {
            navigate('/allcampaigns');
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleContinue = () => {
        if (!isViewMode && currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const updateCampaignData = (data: Partial<Campaign>) => {
        if (!isViewMode) {
            setCampaignData(prev => ({
                ...prev,
                ...data
            }));
        }
    };

    const handleSubmitCampaign = () => {
        if (isViewMode) return;

        setIsSubmitting(true);

        // Update accountIDs based on selected senderAccounts
        const updatedCampaignData = {
            ...campaignData,
            accountIDs: campaignData.senderAccounts?.map(account => account.id) || [],
        };

        createCampaign(
            { CampaignData: updatedCampaignData as Campaign },
            {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: "Campaign created successfully!",
                    });
                    navigate('/allcampaigns');
                },
                onError: (error) => {
                    toast({
                        title: "Error",
                        description: `Failed to create campaign: ${error.message || 'Unknown error'}`,
                        variant: "destructive",
                    });
                },
                onSettled: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    // Handle campaign pause action
    const handlePauseCampaign = () => {
        if (!campaignId) return;

        setIsPausingCampaign(true);

        // Use the updateCampaign mutation
        updateCampaign(
            {
                campaignId,
                campaignData: {
                    status: CampaignState.PAUSED,
                    // Include other required fields if your API needs them
                    name: campaignData.name || '',
                    description: campaignData.description || '',
                }
            },
            {
                onSuccess: () => {
                    // Update local state to reflect the change
                    setCampaignData(prev => ({
                        ...prev,
                        state: CampaignState.PAUSED
                    }));

                    toast({
                        title: "Campaign Paused",
                        description: "The campaign has been paused successfully."
                    });

                    // Refetch the campaign data to ensure we have the latest state
                    refetchCampaign();
                },
                onError: (error) => {
                    toast({
                        title: "Error",
                        description: `Failed to pause campaign: ${error.message || 'Unknown error'}`,
                        variant: "destructive",
                    });
                },
                onSettled: () => {
                    setIsPausingCampaign(false);
                }
            }
        );
    };

    // Handle campaign resume action
    const handleResumeCampaign = () => {
        if (!campaignId) return;

        setIsResumingCampaign(true);

        // Use the updateCampaign mutation
        updateCampaign(
            {
                campaignId,
                campaignData: {
                    status: CampaignState.RUNNING,
                    // Include other required fields if your API needs them
                    name: campaignData.name || '',
                    description: campaignData.description || '',
                }
            },
            {
                onSuccess: () => {
                    // Update local state to reflect the change
                    setCampaignData(prev => ({
                        ...prev,
                        state: CampaignState.RUNNING
                    }));

                    toast({
                        title: "Campaign Resumed",
                        description: "The campaign has been resumed successfully."
                    });

                    // Refetch the campaign data to ensure we have the latest state
                    refetchCampaign();
                },
                onError: (error) => {
                    toast({
                        title: "Error",
                        description: `Failed to resume campaign: ${error.message || 'Unknown error'}`,
                        variant: "destructive",
                    });
                },
                onSettled: () => {
                    setIsResumingCampaign(false);
                }
            }
        );
    };

    // Format date for display
    const formatDate = (timestamp?: number | string) => {
        if (!timestamp) return 'N/A';
        try {
            const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
            const dateValue = numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp;
            return format(new Date(dateValue), 'MMM d, yyyy');
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Get status display for campaign
    const getCampaignStatus = (state?: CampaignState) => {
        if (!state) return { label: 'Unknown', className: 'bg-gray-100 text-gray-700 border-gray-200' };

        switch (state) {
            case CampaignState.RUNNING:
                return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' };
            case CampaignState.PAUSED:
                return { label: 'Paused', className: 'bg-amber-100 text-amber-700 border-amber-200' };
            case CampaignState.STOPPED:
                return { label: 'Stopped', className: 'bg-red-100 text-red-700 border-red-200' };
            case CampaignState.COMPLETED:
                return { label: 'Completed', className: 'bg-blue-100 text-blue-700 border-blue-200' };
            default:
                return { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    // Merge campaign insights with campaign data for stats display
    const campaignDataWithStats = React.useMemo(() => {
        if (!campaignInsights) return campaignData;

        return {
            ...campaignData,
            stats: {
                connectionsSent: campaignInsights.connectionsSent || 0,
                connectionsAccepted: campaignInsights.connectionsAccepted || 0,
                messagesSent: campaignInsights.messagesSent || 0,
                messagesReceived: campaignInsights.messagesReceived || 0,
                ...campaignInsights,
            }
        };
    }, [campaignData, campaignInsights]);

    const renderStepContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-transparent border-primary" role="status"></div>
                        <p className="mt-4 text-gray-600">Loading campaign details...</p>
                    </div>
                </div>
            );
        }

        if (loadError) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Failed to load campaign</h3>
                        <p className="text-gray-600 mt-2">{loadError}</p>
                        <Button onClick={() => navigate('/allcampaigns')} className="mt-4">
                            Back to Campaigns
                        </Button>
                    </div>
                </div>
            );
        }

        // Special handling for deleted LinkedIn accounts
        const hasDeletedAccounts = campaignData.senderAccounts?.some(account => account.isDeleted);

        switch (currentStep) {
            case 1:
                return (
                    //console.log("Rendering LinkedIn Senders with accounts:", campaignData.senderAccounts),
                    <>
                        {hasDeletedAccounts && isViewMode && (
                            <Alert className="mb-6 bg-amber-50 border-amber-200">
                                <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                                <AlertDescription className="text-amber-800">
                                    Some LinkedIn accounts used in this campaign are no longer available. They may have been deleted or disconnected.
                                </AlertDescription>
                            </Alert>
                        )}

                        <LinkedInSenders
                            selectedAccounts={campaignData.senderAccounts || []}
                            updateAccounts={(accounts) => updateCampaignData({ senderAccounts: accounts })}
                            viewMode={isViewMode}
                        />
                    </>
                );
            case 2:
                const leadsToPass = Array.isArray(campaignData.leads)
                    ? campaignData.leads
                    : campaignData.leads?.data || [];

                return <CampaignAnalytics
                    campaignInsights={campaignInsights}
                    leadData={leadsToPass}
                    updateLeads={(leads) => {
                        // If original leads is an array, update directly
                        if (Array.isArray(campaignData.leads)) {
                            updateCampaignData({ leads });
                        } else {
                            // Otherwise update the nested data structure
                            updateCampaignData({
                                leads: {
                                    ...(campaignData.leads || {}),
                                    data: leads
                                }
                            });
                        }
                    }}
                    viewMode={isViewMode}
                />;
            case 3:

                ////console.log("Rendering Sequence with workflow:", campaignData.workflow);
                return <Sequence
                    workflowData={transformWorkflowData(campaignData.workflow)}
                    updateWorkflow={(workflow) => updateCampaignData({ workflow })}
                    viewMode={isViewMode}
                />;
            case 4:

                //console.log("Rendering ReviewLaunch with campaign data:", campaignData);
                return <ReviewLaunch
                    campaignData={transformCampaignForReview(campaignData, campaignInsights)}
                    updateCampaignData={updateCampaignData}
                    onSubmit={handleSubmitCampaign}
                    isSubmitting={isSubmitting}
                    viewMode={isViewMode}
                />;
            default:
                return <LinkedInSenders
                    selectedAccounts={campaignData.senderAccounts || []}
                    updateAccounts={(accounts) => updateCampaignData({ senderAccounts: accounts })}
                    viewMode={isViewMode}
                />;
        }
    };

    // Get status for the campaign
    const campaignStatus = getCampaignStatus(campaignData.state);

    return (
        <div className="flex-1 bg-purple-50/30 p-6 transition-all">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {isViewMode ? 'Back to Campaigns' : 'Back'}
                        </Button>

                        <div>
                            <div className="flex items-center flex-wrap gap-2">
                                <h1 className="text-2xl font-semibold text-gray-900">
                                    {isViewMode ? campaignData.name || 'Campaign Details' : 'Create Campaign'}
                                </h1>
                                {isViewMode && campaignData.id && (
                                    <span className="text-sm text-gray-500 font-normal">
                                        (ID: {campaignData.id})
                                    </span>
                                )}
                                {isViewMode && (
                                    <Badge variant="outline" className="ml-1 bg-blue-100 border-blue-200 text-blue-800 flex items-center gap-1.5">
                                        <Lock className="h-3 w-3" />
                                        View Only
                                    </Badge>
                                )}
                            </div>

                            {isViewMode && (
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-gray-500">
                                    <Badge className={campaignStatus.className}>
                                        {campaignStatus.label}
                                    </Badge>
                                    <span className="flex items-center">
                                        Created: {formatDate(campaignData.createdAt)}
                                    </span>
                                    {campaignData.lastUpdatedAt && (
                                        <span className="flex items-center text-gray-400">
                                            • Last updated: {formatDate(campaignData.lastUpdatedAt)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View mode action buttons */}
                    {isViewMode && (
                        <div className="flex flex-wrap items-center gap-2">
                            {!insightsLoading && campaignInsights && (
                                <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                                    <div className="flex items-center text-xs space-x-1 text-gray-500">
                                        <Users className="w-3.5 h-3.5 text-blue-500" />
                                        <span>{campaignInsights.connectionsSent || 0}</span>
                                    </div>
                                    <div className="flex items-center text-xs space-x-1 text-gray-500">
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        <span>{campaignInsights.connectionsAccepted || 0}</span>
                                    </div>
                                    <div className="flex items-center text-xs space-x-1 text-gray-500">
                                        <MessageCircle className="w-3.5 h-3.5 text-purple-500" />
                                        <span>{campaignInsights.messagesSent || 0}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100"
                                onClick={() => window.open(`/campaign/analytics/${campaignId}`, '_blank')}
                            >
                                <BarChart2 className="w-4 h-4 mr-2" />
                                Analytics
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/campaign/edit/${campaignId}`)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Campaign
                            </Button>

                            {campaignData.state === CampaignState.RUNNING && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    onClick={handlePauseCampaign}
                                    disabled={isPausingCampaign}
                                >
                                    {isPausingCampaign ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full mr-2"></div>
                                            Pausing...
                                        </div>
                                    ) : (
                                        <>
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause Campaign
                                        </>
                                    )}
                                </Button>
                            )}

                            {campaignData.state === CampaignState.PAUSED && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    onClick={handleResumeCampaign}
                                    disabled={isResumingCampaign}
                                >
                                    {isResumingCampaign ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full mr-2"></div>
                                            Resuming...
                                        </div>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Resume Campaign
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Create mode action buttons */}
                    {!isViewMode && (
                        currentStep < 4 ? (
                            <Button
                                onClick={handleContinue}
                                className="bg-primary hover:bg-primary/90 text-white"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmitCampaign}
                                className="bg-primary hover:bg-primary/90 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Launch Campaign'}
                            </Button>
                        )
                    )}
                </div>

                {/* View mode banner */}
                {isViewMode && (
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-2 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                You are viewing this campaign in read-only mode. Navigate between sections using the breadcrumb below.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Breadcrumb - allows navigation in view mode */}
                <CampaignBreadcrumb
                    steps={steps}
                    currentStep={currentStep}
                    onStepChange={handleStepChange}
                    viewMode={isViewMode}
                />

                {/* Content */}
                <div className={`mt-6 ${isViewMode ? 'bg-white p-6 rounded-xl shadow-sm border border-gray-100' : ''}`}>
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
};

// Main component wrapped in DashboardLayout
const ViewCampaignPage = () => {
    return (
        <DashboardLayout activePage="campaigns">
            <CampaignViewContent />
        </DashboardLayout>
    );
};

export default ViewCampaignPage;