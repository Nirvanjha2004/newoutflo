import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddLeadsModal } from "@/components/Leads/AddLeadsModal";
import { CSVUploadModal } from "@/components/Leads/CSVUploadModal";
import { CSVMappingModal } from "@/components/Leads/CSVMappingModal";
import { LeadSource, CSVData } from "../types/leads";
import { Sidebar } from "@/components/Sidebar";
import { Sun, Moon } from "lucide-react";

export default function Leads() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showCSVMapping, setShowCSVMapping] = useState(false);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Mock data - set to empty array to show empty state
  const leads: any[] = [];

  const handleSidebarToggle = () => {
    setIsLeftSidebarExpanded(prev => !prev);
  };

  const handleThemeToggle = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const handleSelectSource = (source: LeadSource) => {
    if (source === "csv-upload") {
      setShowAddModal(false);
      setShowCSVUpload(true);
    }
    // Handle other sources here
  };

  const handleFileUploaded = (data: CSVData) => {
    setCsvData(data);
    setShowCSVUpload(false);
    setShowCSVMapping(true);
  };

  const handleBackToUpload = () => {
    setShowCSVMapping(false);
    setShowCSVUpload(true);
  };

  const handleUploadComplete = () => {
    setShowCSVMapping(false);
    console.log("Upload completed!");
  };

  const handleCloseAll = () => {
    setShowAddModal(false);
    setShowCSVUpload(false);
    setShowCSVMapping(false);
    setCsvData(null);
  };

  // Theme-based styling
  const pageBackground = theme === "dark" ? "bg-[#1a1625] text-white" : "bg-gray-50 text-gray-900";
  const cardBackground = theme === "dark" ? "bg-[#252037]" : "bg-white border border-gray-200";
  const notificationBackground = theme === "dark" ? "bg-[#2a2139]" : "bg-blue-50 border border-blue-200";
  const notificationIconBg = theme === "dark" ? "bg-indigo-600" : "bg-blue-500";
  const notificationText = theme === "dark" ? "text-white" : "text-blue-800";
  const notificationButtonText = theme === "dark" ? "text-indigo-400 hover:text-indigo-300" : "text-blue-600 hover:text-blue-500";
  const tabBorder = theme === "dark" ? "border-slate-700" : "border-gray-200";
  const activeTabText = theme === "dark" ? "text-white border-white" : "text-gray-900 border-gray-900";
  const inactiveTabText = theme === "dark" ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-700";
  const emptyStateCard = theme === "dark" ? "bg-slate-700" : "bg-gray-100";
  const emptyStateElement = theme === "dark" ? "bg-slate-600" : "bg-gray-200";
  const primaryButton = theme === "dark" 
    ? "bg-[#7c3aed] hover:bg-[#6d28d9]" 
    : "bg-purple-600 hover:bg-purple-700";

  return (
    <div className={`min-h-screen ${pageBackground} flex`}>
      {/* Sidebar */}
      <Sidebar 
        isExpanded={isLeftSidebarExpanded}
        onToggle={handleSidebarToggle}
        theme={theme}
      />

      {/* Main Content Container with proper padding */}
      <div className="flex-1 flex flex-col p-6 space-y-4">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center">
          <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Leads <span className={theme === "dark" ? "text-indigo-400" : "text-purple-600"}>Management</span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            className={`rounded-full p-2 ${theme === "dark" ? "text-white hover:bg-[#2e2844]" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>

        {/* Campaign Notification Card */}
        <div className={`${notificationBackground} p-4 rounded-lg flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full ${notificationIconBg} flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${notificationText}`}>Your campaigns are not operating since they're outside of working hours at the moment.</span>
          </div>
          <button className={`${notificationButtonText} text-sm`}>Adjust my schedule</button>
        </div>
        
        {/* Main Content Card */}
        <div className={`${cardBackground} rounded-lg flex-1 flex flex-col overflow-hidden`}>
          {/* Navigation Tabs with proper spacing */}
          <div className={`px-6 pt-4 pb-2 border-b ${tabBorder}`}>
            <div className="flex">
              <button className={`font-medium py-2 px-4 border-b-2 mr-12 ${activeTabText}`}>
                Add Leads
              </button>
              <button className={`py-2 px-4 mr-12 ${inactiveTabText}`}>
                Create a Sequence
              </button>
              <button className={`py-2 px-4 ${inactiveTabText}`}>
                Settings
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            <h1 className={`text-2xl font-semibold mb-8 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Lists of leads</h1>
            
            {leads.length === 0 ? (
              // Empty State
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <div className={`${emptyStateCard} rounded-2xl p-8 mb-4 shadow-lg`}>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${emptyStateElement} rounded-full`}></div>
                            <div className={`h-3 ${emptyStateElement} rounded flex-1`}></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${emptyStateElement} rounded-full`}></div>
                            <div className={`h-3 ${emptyStateElement} rounded flex-1`}></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${emptyStateElement} rounded-full`}></div>
                            <div className={`h-3 ${emptyStateElement} rounded flex-1`}></div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        <div className="bg-green-500 rounded-full p-2 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className={`mb-8 text-lg ${theme === "dark" ? "text-slate-300" : "text-gray-600"}`}>
                    Add leads from LinkedIn to this campaign.
                  </p>
                  
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    className={`${primaryButton} text-white px-8 py-3 rounded-lg font-medium transition-colors`}
                  >
                    Add leads
                  </Button>
                </div>
              </div>
            ) : (
              // List State (when leads exist)
              <div className="space-y-4">
                {/* Lead list would go here */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddLeadsModal
        open={showAddModal}
        onClose={handleCloseAll}
        onSelectSource={handleSelectSource}
        theme={theme}
      />

      <CSVUploadModal
        open={showCSVUpload}
        onClose={handleCloseAll}
        onFileUploaded={handleFileUploaded}
        theme={theme}
      />

      {csvData && (
        <CSVMappingModal
          open={showCSVMapping}
          onClose={handleCloseAll}
          onBack={handleBackToUpload}
          csvData={csvData}
          onUpload={handleUploadComplete}
          theme={theme}
        />
      )}
    </div>
  );
}
