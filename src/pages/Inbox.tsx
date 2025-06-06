import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InboxContent } from "@/components/Inbox/InboxContent";
import { ConversationView } from "@/components/Inbox/ConversationView";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Conversation } from "@/types/inbox";
import DashboardLayout from "@/components/DashboardLayout";

const InboxMainContent = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState<Conversation | null>(null);

  const handleProfilePreview = (conversation: Conversation) => {
    setProfileData(conversation);
    setIsProfileSidebarOpen(true);
  };

  // const handleSidebarToggle = (expanded: boolean) => {
  //   setIsLeftSidebarExpanded(expanded);
  //   // Auto-open profile sidebar when left sidebar is contracted
  //   if (!expanded && selectedConversation) {
  //     setIsProfileSidebarOpen(true);
  //     setProfileData(selectedConversation);
  //   }
  // };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <div 
        className={`flex-1 flex shadow-xl rounded-l-2xl bg-white transition-all duration-300 ${
          isProfileSidebarOpen ? 'mr-80' : 'mr-0'
        }`}
      >
        <InboxContent 
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onProfilePreview={handleProfilePreview}
        />
        <ConversationView 
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onProfilePreview={handleProfilePreview}
        />
      </div>
    </div>
  );
};

const Inbox = () => {
  return (
    <DashboardLayout activePage="inbox">
      <InboxMainContent />
    </DashboardLayout>
  );
};

export default Inbox;