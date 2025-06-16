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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Global Inbox Header */}
      {/* <div className="w-full bg-white border-b border-gray-200 py-3 px-4 shadow-sm"> */}
        {/* <div className="flex items-center justify-between"> */}
          {/* <div className="flex items-center space-x-2">
            <h1 className="text-[24px] font-extrabold text-black">UniBox</h1>
          </div> */}
          {/* <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div> */}
        {/* </div> */}
      {/* </div> */}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
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

        {/* Profile Sidebar - Right panel */}
        {isProfileSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto fixed right-0 top-0 h-screen">
            <ProfileSidebar 
              conversation={profileData} 
              onClose={() => setIsProfileSidebarOpen(false)}
            />
          </div>
        )}
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