
import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
}

interface CampaignBreadcrumbProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (stepId: number) => void;
}

const CampaignBreadcrumb = ({ steps, currentStep, onStepChange }: CampaignBreadcrumbProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <button
                onClick={() => onStepChange(step.id)}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  step.id < currentStep
                    ? 'bg-primary border-primary text-white'
                    : step.id === currentStep
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-primary hover:text-primary'
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </button>
              <span
                className={`ml-3 text-sm font-medium cursor-pointer transition-colors ${
                  step.id <= currentStep ? 'text-primary' : 'text-gray-500'
                }`}
                onClick={() => onStepChange(step.id)}
              >
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-6">
                <div
                  className={`h-0.5 transition-colors ${
                    step.id < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CampaignBreadcrumb;
