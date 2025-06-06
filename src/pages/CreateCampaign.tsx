import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CampaignBreadcrumb from '@/components/Campaign/CampaignBreadcrumb';
import LinkedInSenders from '@/components/Campaign/LinkedInSenders';
import ListOfLeads from '@/components/Campaign/ListOfLeads';
import Sequence from '@/components/Campaign/Sequence';
import ReviewLaunch from '@/components/Campaign/ReviewLaunch';
import { usePostCampaign } from '@/hooks/useCampaignMutations';
import { Campaign, CampaignState } from '@/types/campaigns';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

// Campaign creation content component
const CreateCampaignContent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Campaign data state
  const [campaignData, setCampaignData] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    state: CampaignState.STOPPED,
    senderAccounts: [],
    accountIDs: [],
  });

  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize campaign mutation
  const { mutate: createCampaign } = usePostCampaign();

  const steps = [
    { id: 1, title: 'LinkedIn Senders' },
    { id: 2, title: 'List of Leads' },
    { id: 3, title: 'Sequence' },
    { id: 4, title: 'Review & Launch' }
  ];

  const handleStepChange = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const updateCampaignData = (data: Partial<Campaign>) => {
    setCampaignData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  const handleSubmitCampaign = () => {
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
          navigate('/allcampaigns'); // Redirect to campaigns list
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
    switch (currentStep) {
      case 1:
        return <LinkedInSenders 
                 selectedAccounts={campaignData.senderAccounts || []}
                 updateAccounts={(accounts) => updateCampaignData({ senderAccounts: accounts })} 
               />;
      case 2:
        return <ListOfLeads 
                 leadData={campaignData.leads} 
                 updateLeads={(leads) => updateCampaignData({ leads })}
               />;
      case 3:
        return <Sequence 
                 workflowData={campaignData.workflow}
                 updateWorkflow={(workflow) => updateCampaignData({ workflow })}
                 operationalTimes={campaignData.localOperationalTimes}
                 updateOperationalTimes={(times) => updateCampaignData({ localOperationalTimes: times })}
               />;
      case 4:
        return <ReviewLaunch 
                 campaignData={campaignData}
                 updateCampaignData={updateCampaignData}
                 onSubmit={handleSubmitCampaign}
                 isSubmitting={isSubmitting}
               />;
      default:
        return <LinkedInSenders 
                 selectedAccounts={campaignData.senderAccounts || []}
                 updateAccounts={(accounts) => updateCampaignData({ senderAccounts: accounts })} 
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
              disabled={currentStep === 1}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Create Campaign</h1>
          </div>
          
          {currentStep < 4 ? (
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
          )}
        </div>

        {/* Breadcrumb */}
        <CampaignBreadcrumb
          steps={steps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
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
