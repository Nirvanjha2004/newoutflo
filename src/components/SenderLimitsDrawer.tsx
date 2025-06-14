import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Account } from '@/types/accounts';
import { toast } from "@/components/ui/use-toast";

interface SenderLimitsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

const SenderLimitsDrawer = ({ isOpen, onClose, account }: SenderLimitsDrawerProps) => {
  // Initialize state with default values
  const [maxFollows, setMaxFollows] = useState([40]);
  const [maxMessages, setMaxMessages] = useState([40]);
  const [maxInMail, setMaxInMail] = useState([40]);
  const [maxConnections, setMaxConnections] = useState([25]);
  const [maxProfileViews, setMaxProfileViews] = useState([40]);
  const [isSaving, setIsSaving] = useState(false);

  // Update slider values when account changes
  useEffect(() => {
    if (account) {
      // Initialize from account limits if available
      setMaxFollows([account.limits?.maxFollows || 40]);
      setMaxMessages([account.limits?.maxMessages || 40]);
      setMaxInMail([account.limits?.maxInMail || 40]);
      setMaxConnections([account.limits?.maxConnections || 25]);
      setMaxProfileViews([account.limits?.maxProfileViews || 40]);
    }
  }, [account]);

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!account) return "??";
    return `${account.firstName?.charAt(0) || ""}${account.lastName?.charAt(0) || ""}`;
  };

  // Handle save limits
  const handleSaveLimits = async () => {
    if (!account) return;
    
    setIsSaving(true);
    try {
      // Here you would call your API to update the account limits
      // For example:
      // await updateAccountLimits(account.id, {
      //   maxFollows: maxFollows[0],
      //   maxMessages: maxMessages[0],
      //   maxInMail: maxInMail[0],
      //   maxConnections: maxConnections[0],
      //   maxProfileViews: maxProfileViews[0]
      // });
      
      // Show success toast
      toast({
        title: "Limits updated",
        description: "Account limits have been saved successfully.",
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
              <label className="block text-sm font-medium text-gray-700">
                Max Follows/day
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={maxFollows}
                    onValueChange={setMaxFollows}
                    max={40}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Input
                  type="number"
                  value={maxFollows[0]}
                  onChange={(e) => setMaxFollows([parseInt(e.target.value) || 0])}
                  className="w-16 h-8 text-sm"
                  min={0}
                  max={40}
                />
              </div>
            </div>

            {/* Max Messages/day */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Max Messages/day
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={maxMessages}
                    onValueChange={setMaxMessages}
                    max={40}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Input
                  type="number"
                  value={maxMessages[0]}
                  onChange={(e) => setMaxMessages([parseInt(e.target.value) || 0])}
                  className="w-16 h-8 text-sm"
                  min={0}
                  max={40}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Footer with Save button */}
        <DrawerFooter className="border-t border-gray-200 p-6">
          <Button 
            onClick={handleSaveLimits} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Limits"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SenderLimitsDrawer;
