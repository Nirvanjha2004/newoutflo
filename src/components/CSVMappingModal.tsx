
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
}

const columnTypeOptions: { value: ColumnType; label: string; icon?: string }[] = [
  { value: "do-not-import", label: "Do not import", icon: "🚫" },
  { value: "url", label: "URL" },
  { value: "first-name", label: "First Name", icon: "👤" },
  { value: "last-name", label: "Last Name", icon: "👤" },
  { value: "full-name", label: "Full Name" },
  { value: "headline", label: "Headline" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "job-title", label: "Job Title", icon: "💼" },
  { value: "company-url", label: "Company URL" },
  { value: "tags", label: "Tags" },
  { value: "first-para", label: "First Para" }
];

export function CSVMappingModal({ open, onClose, onBack, csvData, onUpload }: CSVMappingModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Choose another method
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          <h2 className="text-2xl font-semibold mb-8 text-white">Upload CSV File</h2>
          
          {/* File Info */}
          <div className="border border-slate-600 rounded-lg p-4 mb-6 bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-slate-400 text-sm">{csvData.fileSize}</div>
                <div className="font-medium text-white">{csvData.fileName}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              File processed
            </div>
          </div>

          {/* Column Mapping */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-400 border-b border-slate-700 pb-2">
              <div>Column Name</div>
              <div>Select Type</div>
              <div>Samples</div>
            </div>

            {csvData.columns.map((column) => (
              <div key={column.name} className="grid grid-cols-3 gap-4 items-start">
                <div className="font-medium text-white">{column.name}</div>
                <div>
                  <Select
                    value={columnMappings[column.name]}
                    onValueChange={(value: ColumnType) => handleColumnTypeChange(column.name, value)}
                  >
                    <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {columnTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
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
                  {column.samples.slice(0, 4).map((sample, idx) => (
                    <div key={idx} className="text-sm text-slate-400">
                      {sample.length > 50 ? `${sample.substring(0, 50)}...` : sample}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="mt-8 space-y-4">
            <div className="text-lg font-medium text-white">Check for duplicates across all</div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="campaigns"
                  checked={checkCampaigns}
                  onCheckedChange={(checked) => setCheckCampaigns(checked === true)}
                />
                <label htmlFor="campaigns" className="text-sm text-slate-300">Campaigns</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lists"
                  checked={checkLists}
                  onCheckedChange={(checked) => setCheckLists(checked === true)}
                />
                <label htmlFor="lists" className="text-sm text-slate-300">Lists</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workspace"
                  checked={checkWorkspace}
                  onCheckedChange={(checked) => setCheckWorkspace(checked === true)}
                />
                <label htmlFor="workspace" className="text-sm text-slate-300">The Workspace</label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="verify"
                checked={verifyLeads}
                onCheckedChange={(checked) => setVerifyLeads(checked === true)}
              />
              <label htmlFor="verify" className="text-sm text-slate-300">Verify leads</label>
              <span className="text-sm text-yellow-400">⚡ 0.25 / Row</span>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Detected {csvData.rowCount} data rows</span>
          </div>
        </div>

        <div className="flex justify-center border-t border-slate-700 pt-4">
          <Button
            onClick={onUpload}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            UPLOAD ALL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
