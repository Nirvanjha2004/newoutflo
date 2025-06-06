
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, User } from "lucide-react";

interface ProfilePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
}

export const ProfilePreviewDialog = ({ isOpen, onClose, conversation }: ProfilePreviewDialogProps) => {
  const [notes, setNotes] = useState("testing");

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-3 mb-6">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {conversation.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{conversation.name}</h3>
                <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                  Sr. US IT Recruiter at Artifact Global
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">Origin:</span>
                <span className="text-sm font-medium text-gray-700">Profile Connections</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-2 mb-6">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-blue-500 text-white text-xs">H</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">Hrishikesh Vibhandik</span>
            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">✓</Badge>
          </div>

          {/* Add Label Button */}
          <Button variant="outline" size="sm" className="w-full mb-6 text-gray-600 border-gray-300">
            <Plus size={16} className="mr-1" />
            Add label
          </Button>

          {/* See Full Profile Button */}
          <Button className="w-full mb-6 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
            <User size={16} className="mr-2" />
            See full profile
          </Button>

          {/* About Section */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">About</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Birthday</span>
                <span className="text-gray-600">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-600">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="text-gray-600">Piscataway, New Jersey, United States</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-600">-</span>
              </div>
            </div>
          </div>

          {/* Current Position */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Current position</h4>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">AG</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm text-gray-900">Sr. US IT Recruiter at Artifact Global</div>
                <div className="text-xs text-gray-500">Artifact Global</div>
                <div className="text-xs text-gray-400">Piscataway, NJ 08854 • October 2024 - Present</div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
