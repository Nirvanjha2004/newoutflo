
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface InboxFiltersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InboxFiltersDialog = ({ isOpen, onClose }: InboxFiltersDialogProps) => {
  const [selectedAccount, setSelectedAccount] = useState("all-accounts");
  const [selectedCampaign, setSelectedCampaign] = useState("all-campaigns");
  const [selectedLabels, setSelectedLabels] = useState("no-labels");

  const handleApplyFilters = () => {
    // Apply filter logic here
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedAccount("all-accounts");
    setSelectedCampaign("all-campaigns");
    setSelectedLabels("no-labels");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">Inbox filters</DialogTitle>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Filter by account */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by account</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-accounts">All accounts</SelectItem>
                <SelectItem value="primary">Primary Account</SelectItem>
                <SelectItem value="secondary">Secondary Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter by campaign */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by campaign</label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-campaigns">All campaigns</SelectItem>
                <SelectItem value="campaign-1">Campaign 1</SelectItem>
                <SelectItem value="campaign-2">Campaign 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter by labels */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by labels</label>
            <Select value={selectedLabels} onValueChange={setSelectedLabels}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select labels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-labels">No labels available</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="follow-up">Follow Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Clear all filters
            </Button>
            <Button 
              onClick={handleApplyFilters}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
            >
              Apply filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
