import React from 'react';
import { X, ExternalLink, Shield, Chrome } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LinkedInConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LinkedInConnectionModal = ({ isOpen, onClose }: LinkedInConnectionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 relative bg-gradient-to-r from-gray-50 to-white border-b">
          {/* <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button> */}
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center whitespace-nowrap">
            Connect your LinkedIn account
          </DialogTitle>
          {/* <DialogDescription className="text-sm text-gray-600 text-center mt-2 whitespace-nowrap">
            Choose your preferred method to connect with LinkedIn
          </DialogDescription> */}
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5 pt-4">
          {/* OutFlo Chrome Extension Option */}
          <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all relative cursor-pointer shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Chrome className="w-6 h-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">OutFlo Chrome Extension</h3>
                  <span className="px-2 py-0.5 bg-primary/90 text-white text-xs font-medium rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Connect to OutFlo using an existing LinkedIn login session
                </p>
              </div>
              <div className="w-6 h-6 border-2 border-primary rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Get OutFlo Extension Button */}
          <Button
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 h-auto rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg"
            onClick={() => {
              // Handle extension download
              window.open('https://chromewebstore.google.com/detail/outflo-connect-%E2%80%93-scale-ou/cmikcdbkjpaejenbajphdelgdjolgdod?authuser=0&hl=en-GB', '_blank');
            }}
          >
            <span>Get OutFlo extension</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>

          {/* Security Notice */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-2">
            <Shield className="w-4 h-4" />
            <span>Secured with TLS 1.3 encryption</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInConnectionModal;
