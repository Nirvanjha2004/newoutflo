import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CampaignBreadcrumb from '@/components/Campaign/CampaignBreadcrumb';
import LinkedInSenders from '@/components/Campaign/LinkedInSenders';
import ListOfLeads from '@/components/Campaign/ListOfLeads';
import Sequence from '@/components/Campaign/Sequence';
import ReviewLaunch from '@/components/Campaign/ReviewLaunch';
import { usePostCampaign } from '@/hooks/useCampaignMutations';
import { Campaign, CampaignState } from '@/types/campaigns';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@/common/api';
import { getCampaignById } from '@/api/campaigns';
import { useCampaignStore } from '@/api/store/campaignStore';

// Campaign creation content component
const CreateCampaignContent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  // Check if we're in view mode (determined by URL path)
  const isViewMode = window.location.pathname.includes('/campaign/view/');
  const campaignId = params.id;

  // Campaign data state
  const [campaignData, setCampaignData] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    state: CampaignState.STOPPED,
    senderAccounts: [],
    accountIDs: [],
  });

  const campaignStore = useCampaignStore();

  // Add this effect to reset the store when component mounts
  useEffect(() => {
    // Only reset when creating a new campaign (not in view mode)
    if (!isViewMode) {
      // Replace the non-existent resetCampaign method with appropriate state reset
      campaignStore.setState({
        campaign: {
          leads: {},
          workflow: {
            steps: []
          },
          senderAccounts: [],
          accountIDs: [],
          name: '',
          description: '',
          state: CampaignState.STOPPED,
          leadListId: undefined
        }
      });
    }
  }, [isViewMode]);
  
  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isViewMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const campaignStoreState = useCampaignStore();

  console.log("Campaign Store State:", campaignStoreState);

  // Fetch campaign data if in view mode
  useEffect(() => {
    if (isViewMode && campaignId) {
      setIsLoading(true);
      getCampaignById(campaignId)
        .then(response => {
          setCampaignData(response.data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error loading campaign:", error);
          setLoadError("Failed to load campaign details");
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load campaign details"
          });
        });
    }
  }, [isViewMode, campaignId]);

  // Initialize campaign mutation
  const { mutate: createCampaign } = usePostCampaign();

  const steps = [
    { id: 1, title: 'LinkedIn Senders' },
    { id: 2, title: 'List of Leads' },
    { id: 3, title: 'Sequence' },
    { id: 4, title: 'Review & Launch' }
  ];

  // Modified to allow navigation in view mode
  const handleStepChange = (stepId: number) => {
    // Remove the view mode check to allow navigation in all modes
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
    const leadListId = campaignStoreState.campaign.leads.leadListId;
    
    // Get operational times from the store
    const operationalTimes = campaignStoreState.campaign.operationalTimes;
    
    console.log("Operational Times from store:", operationalTimes);
    // If operationalTimes is missing, create a default structure based on working hours
    const defaultOperationalTimes = {
      monday: { startTime: 32400, endTime: 61200, enabled: true },
      tuesday: { startTime: 32400, endTime: 61200, enabled: true },
      wednesday: { startTime: 32400, endTime: 61200, enabled: true },
      thursday: { startTime: 32400, endTime: 61200, enabled: true },
      friday: { startTime: 32400, endTime: 61200, enabled: true },
      saturday: { startTime: 32400, endTime: 61200, enabled: true },
      sunday: { startTime: 32400, endTime: 61200, enabled: true }
    };

    // Update accountIDs based on selected senderAccounts
    const updatedCampaignData = {
      ...campaignData,
      accountIDs: campaignData.senderAccounts?.map(account => account.id) || [],
      leadListId: leadListId || campaignData.leadListId || null,
      operationalTimes: operationalTimes , // Add operational times from store
    };

    console.log("Submitting campaign data with operationalTimes:", updatedCampaignData);
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

    switch (currentStep) {
      case 1:
        return <LinkedInSenders
          selectedAccounts={campaignData.senderAccounts || []}
          updateAccounts={(accounts) => updateCampaignData({ senderAccounts: accounts })}
          viewMode={isViewMode}
        />;
      case 2:
        return <ListOfLeads
          leadData={campaignData.leads}
          updateLeads={(leads) => updateCampaignData({ leads })}
          viewMode={isViewMode}
        />;
      case 3:
        return <Sequence
          workflowData={campaignData.workflow}
          updateWorkflow={(workflow) => updateCampaignData({ workflow })}
          operationalTimes={campaignData.localOperationalTimes}
          updateOperationalTimes={(times) => updateCampaignData({ localOperationalTimes: times })}
          viewMode={isViewMode}
        />;
      case 4:
        return <ReviewLaunch
          campaignData={campaignData}
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

  return (
    <div className="flex-1 bg-purple-50 p-6 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            <h1 className="text-2xl font-semibold text-gray-900">
              {isViewMode ? `View Campaign: ${campaignData.name || ''}` : 'Create Campaign'}
            </h1>
            {isViewMode && (
              <div className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                View Only
              </div>
            )}
          </div>

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

        {/* Breadcrumb - Remove disabled prop to allow navigation in view mode */}
        <CampaignBreadcrumb
          steps={steps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
        // The disabled prop is removed to allow clicking in view mode
        />

        {/* Content */}
        <div className="mt-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

// Main component wrapped in DashboardLayout
const CreateCampaign = () => {
  return (
    <DashboardLayout activePage="campaigns">
      <CreateCampaignContent />
    </DashboardLayout>
  );
};

export default CreateCampaign;
