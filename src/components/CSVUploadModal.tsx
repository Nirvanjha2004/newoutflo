
import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle } from "lucide-react";
import { uploadCSVFile } from "@/api/leads";
import { CSVData } from "@/types/leads";

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileUploaded: (data: CSVData) => void;
}

export function CSVUploadModal({ open, onClose, onFileUploaded }: CSVUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-white text-lg">
              CREATE A LIST OF LEADS BELOW • STEP 2 / 4
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6">
          <h2 className="text-2xl font-semibold mb-2 text-white">Upload CSV file</h2>
          <p className="text-slate-400 mb-8">Add LinkedIn profiles from a CSV file</p>

          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-400/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <div className="text-slate-300 mb-2">
                Drag and drop a CSV file here or{' '}
                <label className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                  click to browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-slate-500 text-sm">(max links count: 20,000)</div>
            </div>
          ) : (
            <div className="border border-slate-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-slate-400 text-sm">
                    {Math.round(uploadedFile.size / 1024)} KB
                  </div>
                  <div className="text-white font-medium">{uploadedFile.name}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploading ? (
                <div className="mt-4 text-blue-400 text-sm">Processing file...</div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  File processed
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-slate-700 pt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Back
          </Button>
          <Button 
            disabled={!uploadedFile || uploading}
            className="bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
