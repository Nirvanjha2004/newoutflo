import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface VerificationResultsModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  results: {
    urlsVerified: {
      valid: number;
      invalid: number;
      invalidUrls: { row: number, url: string }[];
    };
    customVariables: {
      present: number;
      missing: number;
      empty: number;
    };
    columnCompleteness: Record<string, {
      missing: number;
      missingRows: number[];
    }>;
    completed: boolean;
  };
  totalRows: number;
  continueEnabled?: boolean; // Add this new prop
}

export function VerificationResultsModal({
  open,
  onClose,
  onContinue,
  results,
  totalRows,
  continueEnabled = false // Default to disabled 
}: VerificationResultsModalProps) {
  // Calculate percentages for visual indicators
  const validUrlsPercentage = totalRows > 0 ? 
    Math.round((results.urlsVerified.valid / totalRows) * 100) : 0;
  
  // Calculate if there are any severe issues
  const hasSevereIssues = results.urlsVerified.invalid > 0 || 
    Object.keys(results.columnCompleteness).length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            Lead Verification Results
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600">Total Leads</div>
              <div className="text-2xl font-semibold mt-1">{totalRows}</div>
            </div>
            <div className={`${results.urlsVerified.valid > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
              <div className={`text-sm ${results.urlsVerified.valid > 0 ? 'text-green-600' : 'text-gray-600'}`}>Valid LinkedIn URLs</div>
              <div className="text-2xl font-semibold mt-1">{results.urlsVerified.valid}</div>
            </div>
            <div className={`${results.urlsVerified.invalid > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
              <div className={`text-sm ${results.urlsVerified.invalid > 0 ? 'text-red-600' : 'text-gray-600'}`}>Invalid URLs</div>
              <div className="text-2xl font-semibold mt-1">{results.urlsVerified.invalid}</div>
            </div>
          </div>
          
          {/* LinkedIn URL Verification */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">LinkedIn URL Verification</h3>
            
            <div className="h-2 w-full bg-gray-100 rounded-full mb-2">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ width: `${validUrlsPercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-600">{validUrlsPercentage}% Valid URLs</span>
              <span className="text-gray-600">
                {results.urlsVerified.valid} of {totalRows} leads
              </span>
            </div>
            
            {results.urlsVerified.invalidUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Invalid LinkedIn URLs
                </h4>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {results.urlsVerified.invalidUrls.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-red-100 last:border-0">
                      <span>Row {item.row}</span>
                      <span className="font-medium truncate max-w-md">{item.url}</span>
                    </div>
                  ))}
                  {results.urlsVerified.invalidUrls.length > 10 && (
                    <div className="text-center text-sm text-red-500 mt-2">
                      + {results.urlsVerified.invalidUrls.length - 10} more invalid URLs
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Custom Variables Check */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Variables</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <div className="text-xs text-gray-600">Present</div>
                <div className="text-xl font-semibold text-green-600">{results.customVariables.present}</div>
              </div>
              <div className={`${results.customVariables.empty > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-200'} rounded-lg p-3`}>
                <div className="text-xs text-gray-600">Empty</div>
                <div className={`text-xl font-semibold ${results.customVariables.empty > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {results.customVariables.empty}
                </div>
              </div>
              <div className={`${results.customVariables.missing > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'} rounded-lg p-3`}>
                <div className="text-xs text-gray-600">Missing</div>
                <div className={`text-xl font-semibold ${results.customVariables.missing > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {results.customVariables.missing}
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Completeness */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Completeness</h3>
            
            {Object.keys(results.columnCompleteness).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(results.columnCompleteness).map(([colName, result]) => (
                  <div key={colName} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-800">{colName}</span>
                      <span className="text-sm text-yellow-700">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Missing in {result.missing} rows
                      </span>
                    </div>
                    {result.missingRows.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Examples: Rows {result.missingRows.join(', ')}
                        {result.missing > result.missingRows.length ? ` and ${result.missing - result.missingRows.length} more...` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 text-green-700 rounded-lg p-4 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                All columns have complete data for all leads
              </div>
            )}
          </div>
          
          {/* Final Assessment */}
          <div className={`${hasSevereIssues ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-green-50 text-green-800 border-green-200'} border rounded-lg p-4`}>
            <h3 className="font-medium flex items-center">
              {hasSevereIssues ? (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Some issues were detected
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Your leads look good!
                </>
              )}
            </h3>
            <p className="mt-1 text-sm">
              {hasSevereIssues 
                ? "Some of your leads have issues that may affect campaign performance. You can continue with the upload or go back to fix the data first."
                : "Your leads passed all verification checks and are ready to be uploaded."}
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between border-t border-gray-100 pt-4">
          {/* Remove Edit Data button and replace with summary text */}
          <div className="text-sm text-gray-600">
            {results.urlsVerified.valid} valid leads will be uploaded
          </div>
          <Button
            onClick={onContinue}
            disabled={!continueEnabled} // Use the prop here
            className={!continueEnabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            Continue with Valid Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}