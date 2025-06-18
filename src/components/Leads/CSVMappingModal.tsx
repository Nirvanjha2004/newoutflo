import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, CheckCircle, X } from "lucide-react";
import { CSVData, ColumnType } from "@/types/leads";

interface CSVMappingModalProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  csvData: CSVData;
  onUpload: () => void;
  theme?: "dark" | "light";
}

const columnTypeOptions: { value: ColumnType; label: string; icon?: string }[] = [
  { value: "do-not-import", label: "Do not import", icon: "🚫" },
  { value: "url", label: "URL" },
  { value: "first-name", label: "First Name", icon: "👤" },
  { value: "last-name", label: "Last Name", icon: "👤" },
  { value: "full-name", label: "Full Name" },
  { value: "head-line", label: "Headline" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "job-title", label: "Job Title", icon: "💼" },
  { value: "tags", label: "Tags" },
  { value: "company-url", label: "Company URL" },
];

export function CSVMappingModal({ open, onClose, onBack, csvData, onUpload, theme = "dark" }: CSVMappingModalProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnType>>(
    csvData.columns.reduce((acc, col) => ({
      ...acc,
      [col.name]: col.type
    }), {})
  );
  const [checkCampaigns, setCheckCampaigns] = useState(true);
  const [checkLists, setCheckLists] = useState(true);
  const [checkWorkspace, setCheckWorkspace] = useState(true);
  const [verifyLeads, setVerifyLeads] = useState(false);

  const handleColumnTypeChange = (columnName: string, type: ColumnType) => {
    setColumnMappings(prev => ({
      ...prev,
      [columnName]: type
    }));
  };

  // Theme-specific styling
  const modalBg = theme === "dark" 
    ? "bg-gradient-to-b from-[#252037]/95 to-[#1e1a2e]/95"
    : "bg-white";
  const modalBorder = theme === "dark" 
    ? "border-[0.5px] border-[#4e3d72]/30" 
    : "border border-gray-200";
  const headerBorder = theme === "dark" 
    ? "border-[#382f53]/70" 
    : "border-gray-200";
  const textColor = theme === "dark" 
    ? "text-white" 
    : "text-gray-900";
  const textSecondary = theme === "dark" 
    ? "text-slate-400" 
    : "text-gray-500";
  const buttonAction = theme === "dark"
    ? "text-indigo-400 hover:text-indigo-300 hover:bg-[#2e2844]/60"
    : "text-purple-600 hover:text-purple-500 hover:bg-gray-100";
  const fileInfoBg = theme === "dark" 
    ? "border-[0.5px] border-[#382f53]/80 bg-[#1e1a2e]/70" 
    : "border border-gray-200 bg-gray-50";
  const tableBorder = theme === "dark" 
    ? "border-[#382f53]/50" 
    : "border-gray-200";
  const rowBorder = theme === "dark" 
    ? "border-[#382f53]/30" 
    : "border-gray-100";
  const selectBg = theme === "dark" 
    ? "bg-[#1e1a2e]/70 border-[#382f53]/70" 
    : "bg-white border-gray-200";
  const selectContentBg = theme === "dark" 
    ? "bg-[#1e1a2e]/90 border-[#382f53]/70" 
    : "bg-white border-gray-200";
  const selectHover = theme === "dark" 
    ? "hover:bg-[#2e2844]/60" 
    : "hover:bg-gray-100";
  const optionsBg = theme === "dark" 
    ? "bg-[#1e1a2e]/60 border-[0.5px] border-[#382f53]/50" 
    : "bg-gray-50 border border-gray-200";
  const labelColor = theme === "dark" 
    ? "text-slate-300" 
    : "text-gray-600";
  const successColor = theme === "dark" 
    ? "text-green-400" 
    : "text-green-600";
  const infoColor = theme === "dark" 
    ? "text-yellow-400" 
    : "text-amber-600";
  const buttonGradient = theme === "dark"
    ? "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21ca]"
    : "bg-purple-600 hover:bg-purple-700";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-2xl ${modalBg} ${theme === "dark" ? "backdrop-blur-lg" : ""} ${modalBorder} ${textColor} shadow-2xl rounded-xl`}
        style={{ 
          backdropFilter: theme === "dark" ? 'blur(12px)' : undefined,
          boxShadow: theme === "dark" 
            ? '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)'
            : undefined
        }}
      >
        <DialogHeader className={`border-b ${headerBorder} pb-3`}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={buttonAction}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Choose another method
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Upload CSV File</h2>
          
          {/* File Info */}
          <div className={`${fileInfoBg} rounded-lg p-3 mb-4 ${theme === "dark" ? "backdrop-blur-sm" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${textSecondary} text-sm`}>{csvData.fileSize}</div>
                <div className={`font-medium ${textColor}`}>{csvData.fileName}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${textSecondary} hover:${textColor} hover:bg-opacity-10 h-7 w-7 p-0 rounded-full`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className={`mt-2 flex items-center gap-2 ${successColor} text-sm`}>
              <CheckCircle className="h-4 w-4" />
              File processed
            </div>
          </div>

          {/* Column Mapping */}
          <div className="space-y-3">
            <div className={`grid grid-cols-3 gap-3 text-sm font-medium ${textSecondary} border-b ${tableBorder} pb-2`}>
              <div>Column Name</div>
              <div>Select Type</div>
              <div>Samples</div>
            </div>

            {/* Custom scrolling area with hidden scrollbars */}
            <div 
              className="max-h-[30vh] pr-2 overflow-auto"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="custom-scrollbar space-y-1">
                {csvData.columns.map((column) => (
                  <div key={column.name} className={`grid grid-cols-3 gap-3 items-start py-2 border-b ${rowBorder}`}>
                    <div className={`font-medium ${textColor} text-sm`}>{column.name}</div>
                    <div>
                      <Select
                        value={columnMappings[column.name]}
                        onValueChange={(value: ColumnType) => handleColumnTypeChange(column.name, value)}
                      >
                        <SelectTrigger className={`w-full ${selectBg} ${textColor} text-sm h-8`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`${selectContentBg}`}>
                          {columnTypeOptions.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value} 
                              className={`${textColor} ${selectHover} text-sm`}
                            >
                              <div className="flex items-center gap-2">
                                {option.icon && <span>{option.icon}</span>}
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      {column.samples.slice(0, 2).map((sample, idx) => (
                        <div key={idx} className={`text-xs ${textSecondary}`}>
                          {sample.length > 30 ? `${sample.substring(0, 30)}...` : sample}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className={`mt-6 space-y-3 ${optionsBg} p-3 rounded-lg`}>
            <div className={`text-base font-medium ${textColor}`}>Check for duplicates across all</div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="campaigns"
                  checked={checkCampaigns}
                  onCheckedChange={(checked) => setCheckCampaigns(checked === true)}
                  className={theme === "dark" ? "border-indigo-400 data-[state=checked]:bg-indigo-500" : "border-purple-400 data-[state=checked]:bg-purple-600"}
                />
                <label htmlFor="campaigns" className={`text-xs ${labelColor}`}>Campaigns</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lists"
                  checked={checkLists}
                  onCheckedChange={(checked) => setCheckLists(checked === true)}
                  className={theme === "dark" ? "border-indigo-400 data-[state=checked]:bg-indigo-500" : "border-purple-400 data-[state=checked]:bg-purple-600"}
                />
                <label htmlFor="lists" className={`text-xs ${labelColor}`}>Lists</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workspace"
                  checked={checkWorkspace}
                  onCheckedChange={(checked) => setCheckWorkspace(checked === true)}
                  className={theme === "dark" ? "border-indigo-400 data-[state=checked]:bg-indigo-500" : "border-purple-400 data-[state=checked]:bg-purple-600"}
                />
                <label htmlFor="workspace" className={`text-xs ${labelColor}`}>The Workspace</label>
              </div>
            </div>

            <div className={`flex items-center space-x-2 pt-2 border-t ${rowBorder}`}>
              <Checkbox
                id="verify"
                checked={verifyLeads}
                onCheckedChange={(checked) => setVerifyLeads(checked === true)}
                className={theme === "dark" ? "border-yellow-400 data-[state=checked]:bg-yellow-500" : "border-amber-400 data-[state=checked]:bg-amber-500"}
              />
              <label htmlFor="verify" className={`text-xs ${labelColor}`}>Verify leads</label>
              <span className={`text-xs ${infoColor}`}>⚡ 0.25 / Row</span>
            </div>
          </div>

          {/* Summary */}
          <div className={`mt-4 flex items-center gap-2 ${successColor} text-sm`}>
            <CheckCircle className="h-4 w-4" />
            <span>Detected {csvData.rowCount} data rows</span>
          </div>
        </div>

        <div className={`flex justify-center border-t ${headerBorder} pt-4`}>
          <Button
            onClick={onUpload}
            className={`${buttonGradient} text-white px-8 py-2 text-sm rounded-lg shadow-lg`}
          >
            <Upload className="h-4 w-4 mr-2" />
            UPLOAD ALL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
