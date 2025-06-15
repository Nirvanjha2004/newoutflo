import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Account } from '@/types/accounts';
import { useUpdateAccountLimitsMutation } from "@/hooks/useAccountMutations";
import { useAccountConfigQuery } from "@/hooks/useAccountQueries";
import { toast } from "@/components/ui/use-toast";

interface SenderLimitsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

const SenderLimitsDrawer = ({ isOpen, onClose, account }: SenderLimitsDrawerProps) => {
  // Initialize with real account limits from the backend
  const [connectionsLimit, setConnectionsLimit] = useState<number>(0);
  const [messagesLimit, setMessagesLimit] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch account configuration
  const { 
    data: configData,
    isLoading: configLoading,
    error: configError
  } = useAccountConfigQuery(account?.id);
  
  // Initialize mutation hook
  const updateLimits = useUpdateAccountLimitsMutation();

  // Update state when account changes or config data loads
  useEffect(() => {
    if (configData) {
      // Use the data from config endpoint
      setConnectionsLimit(configData.maxConnectionRequestsPerDay || 0);
      setMessagesLimit(configData.maxMessagesPerDay || 0);
    } else if (account) {
      // Fallback to account data if config isn't available yet
      setConnectionsLimit(
        account.configLimits?.maxConnectionRequestsPerDay || 
        account.accountActions?.dailyConnectionLimit ||
        0
      );
      setMessagesLimit(
        account.configLimits?.maxMessagesPerDay || 
        account.accountActions?.dailyMessageLimit ||
        0
      );
    }
  }, [account, configData]);

  // Show loading state
  const showLoading = configLoading && !configData;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!account) return "??";
    return `${account.firstName?.charAt(0) || ""}${account.lastName?.charAt(0) || ""}`;
  };

  // Handle save limits
  const handleSave = async () => {
    if (!account) return;
    
    setIsSaving(true);
    try {
      // Make sure these parameter names match what the backend expects
      const response = await updateLimits.mutateAsync({
        accountId: account.id,
        maxConnectionRequestsPerDay: connectionsLimit,
        maxMessagesPerDay: messagesLimit
      });
      
      console.log("Limits updated successfully:", response);
      
      toast({
        title: "Limits updated",
        description: "Account sending limits have been updated successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to update limits:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update account limits. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render if no account is selected
  if (!account) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-[500px] rounded-none border-l border-gray-200">
        <DrawerHeader className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-semibold text-gray-900">
              Setup sender limits
            </DrawerTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sender Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={account.profileImageUrl || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-600">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {account.firstName} {account.lastName}
              </h3>
              <p className="text-sm text-gray-500">{account.email}</p>
            </div>
          </div>

          {/* Show loading state */}
          {showLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-gray-500">Loading configuration...</span>
            </div>
          )}
          
          {/* Show error if any */}
          {configError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> Could not load account configuration.
                Please try again later.
              </p>
            </div>
          )}

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> The numbers below may vary based on your account's health 
              and activities on other campaigns. We do this to keep your accounts safe.
            </p>
          </div>

          {/* Slider Controls */}
          <div className="space-y-6">
            {/* Max Follows/day */}
            <div className="space-y-3">
              <Label htmlFor="connectionsLimit" className="block text-sm font-medium text-gray-700">
                Maximum connection requests per day
              </Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="connectionsLimit"
                    type="number"
                    value={connectionsLimit}
                    onChange={(e) => setConnectionsLimit(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full h-10 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 20-25 per day to avoid LinkedIn restrictions
              </p>
            </div>

            {/* Max Messages/day */}
            <div className="space-y-3">
              <Label htmlFor="messagesLimit" className="block text-sm font-medium text-gray-700">
                Maximum messages per day
              </Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="messagesLimit"
                    type="number"
                    value={messagesLimit}
                    onChange={(e) => setMessagesLimit(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full h-10 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Maximum 50 messages per day
              </p>
            </div>
          </div>
        </div>

        {/* Add Footer with Save button */}
        <DrawerFooter className="border-t border-gray-200 p-6">
          <Button 
            onClick={handleSave} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSaving || updateLimits.isPending}
          >
            {isSaving || updateLimits.isPending ? "Saving..." : "Save Limits"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SenderLimitsDrawer;