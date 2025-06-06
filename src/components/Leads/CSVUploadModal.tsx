import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, ArrowRight } from "lucide-react";
import { uploadCSVFile } from "../../api/leads";
import { CSVData } from "@/types/leads";

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileUploaded: (data: CSVData) => void;
  theme?: "dark" | "light";
}

export function CSVUploadModal({ open, onClose, onFileUploaded, theme = "dark" }: CSVUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Theme-based styling
  const modalBg = theme === "dark" 
    ? "bg-[#252037]/90 backdrop-blur-md"
    : "bg-white";
  const modalBorder = theme === "dark" 
    ? "border border-[#382f53]" 
    : "border border-gray-200";
  const textColor = theme === "dark" 
    ? "text-white" 
    : "text-gray-900";
  const textSecondary = theme === "dark" 
    ? "text-slate-400" 
    : "text-gray-500";
  const textMuted = theme === "dark" 
    ? "text-slate-500" 
    : "text-gray-400";
  const headerBorder = theme === "dark" 
    ? "border-[#382f53]" 
    : "border-gray-200";
  const dropzoneBorder = theme === "dark" 
    ? "border-[#382f53] hover:border-[#4e3d72]" 
    : "border-gray-300 hover:border-gray-400";
  const dropzoneActive = theme === "dark" 
    ? "border-indigo-400 bg-indigo-400/10" 
    : "border-purple-400 bg-purple-50";
  const fileInfoBg = theme === "dark" 
    ? "bg-[#1e1a2e] border-[#382f53]" 
    : "bg-gray-50 border-gray-200";
  const buttonPrimary = theme === "dark" 
    ? "bg-[#7c3aed] hover:bg-[#6d28d9]" 
    : "bg-purple-600 hover:bg-purple-700";
  const buttonDisabled = theme === "dark" 
    ? "disabled:bg-[#3c2d58]" 
    : "disabled:bg-gray-300";
  const accentColor = theme === "dark" 
    ? "text-indigo-400 hover:text-indigo-300" 
    : "text-purple-600 hover:text-purple-500";
  const uploadingColor = theme === "dark" 
    ? "text-indigo-400 border-indigo-400" 
    : "text-purple-600 border-purple-600";
  const successColor = theme === "dark" 
    ? "text-green-400" 
    : "text-green-600";
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploadedFile(file);
    setUploading(true);
    
    try {
      const result = await uploadCSVFile(file);
      onFileUploaded(result.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-md max-h-[80vh] overflow-y-auto ${modalBg} ${modalBorder} ${textColor} shadow-xl`}
        style={{ 
          backdropFilter: theme === "dark" ? 'blur(8px)' : undefined
        }}
      >
        <DialogHeader className={`border-b ${headerBorder} pb-3`}>
          <div className="flex items-center gap-4">
            <DialogTitle className={`${textColor} text-sm font-medium`}>
              CREATE A LIST OF LEADS • STEP 2/4
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>Upload CSV file</h2>
          <p className={`${textSecondary} text-sm mb-6`}>Add LinkedIn profiles from a CSV file</p>

          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? dropzoneActive
                  : dropzoneBorder
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`h-10 w-10 ${textSecondary} mx-auto mb-3`} />
              <div className={`${theme === "dark" ? "text-slate-300" : "text-gray-600"} text-sm mb-2`}>
                Drag and drop a CSV file here or{' '}
                <label className={`${accentColor} cursor-pointer underline`}>
                  click to browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
              <div className={`${textMuted} text-xs`}>(max links count: 20,000)</div>
            </div>
          ) : (
            <div className={`border rounded-lg p-4 ${fileInfoBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${textSecondary} text-xs`}>
                    {Math.round(uploadedFile.size / 1024)} KB
                  </div>
                  <div className={`${textColor} font-medium text-sm`}>{uploadedFile.name}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className={`${textSecondary} hover:${textColor} ${theme === "dark" ? "hover:bg-[#2e2844]" : "hover:bg-gray-100"} h-7 w-7 p-0`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploading ? (
                <div className={`mt-3 ${uploadingColor} text-xs flex items-center`}>
                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2 ${uploadingColor}`}></div>
                  Processing file...
                </div>
              ) : (
                <div className={`mt-3 flex items-center gap-2 ${successColor} text-xs`}>
                  <CheckCircle className="h-4 w-4" />
                  File processed
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex justify-between items-center border-t ${headerBorder} pt-3`}>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className={theme === "dark" ? "text-slate-300 hover:text-white hover:bg-[#2e2844]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}
          >
            Cancel
          </Button>
          
          <Button 
            disabled={!uploadedFile || uploading}
            onClick={() => {}} // This button doesn't need an action as file upload triggers onFileUploaded
            className={`${buttonPrimary} ${buttonDisabled} text-white text-sm px-4 py-2 disabled:opacity-50`}
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
