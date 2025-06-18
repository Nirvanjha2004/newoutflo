import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, Download, Search, Filter, MoreHorizontal, CheckCircle, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { useCampaignStore } from '@/api/store/campaignStore/campaign'; // Import campaign store
import { nanoid } from 'nanoid'; // For generating unique IDs
import { getMappingSuggestions, processLeadsWithMapping } from '@/api/leads';
import { VerificationResultsModal } from '@/components/VerificationResultsModal';

// Update the Lead interface to include more fields
interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    email?: string;
    avatar: string;
    selected: boolean;
    linkedinUrl?: string; // Add LinkedIn URL field
}

interface UploadedFile {
    name: string;
    size: string;
    processed: boolean;
    fileObject?: File;
}

interface ColumnMapping {
    columnName: string;
    type: string;
    samples: string[];
}

interface ListOfLeadsProps {
    leadData?: any;
    updateLeads: (leads: any) => void;
    viewMode?: boolean;
    onMappingStateChange?: (isMapping: boolean) => void; // Add this prop
}

const ListOfLeads = ({ leadData, updateLeads, viewMode, onMappingStateChange }: ListOfLeadsProps) => {
    const { toast } = useToast();
    // Add these state variables near your other useState declarations
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResults, setVerificationResults] = useState<{
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
    } | null>(null);
    // Use campaign store
    const { setLeadsFile, setLeadsData } = useCampaignStore();
    // Get store data to check if leads already exist
    const storeLeads = useCampaignStore(state => state.campaign.leads);
    console.log('Current leads in store:', storeLeads);
    const [showLeadsGrid, setShowLeadsGrid] = useState(false);
    const [selectedList, setSelectedList] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [validationComplete, setValidationComplete] = useState(false);
    const [validRowsCount, setValidRowsCount] = useState(0);
    const [parsedCsvData, setParsedCsvData] = useState<any[]>([]);
    const [verifySettings, setVerifySettings] = useState({
        checkDuplicates: {
            campaigns: true,
            lists: true,
            workspace: true
        },
        verifyLeads: true
    });
    // Add this state variable near your other state declarations
    const [uploadInitiated, setUploadInitiated] = useState(false);
    // Add this state variable near your other state declarations
    const [verificationFailed, setVerificationFailed] = useState<string | null>(null);

    useEffect(() => {
        // Notify parent when mapping state changes
        if (onMappingStateChange) {
            onMappingStateChange(showColumnMapping);
        }
    }, [showColumnMapping, onMappingStateChange]);

    // Add this function after handleClientSideMapping

    const verifyLeadData = async () => {
        console.log("Starting lead verification process");
        console.log("Parsed CSV data sample:", parsedCsvData);
        console.log("Column mappings:", columnMappings);

        // Validate that we have data to work with
        if (!parsedCsvData || parsedCsvData.length === 0) {
            console.error("No CSV data available for verification");
            return {
                urlsVerified: { valid: 0, invalid: 0, invalidUrls: [] },
                customVariables: { present: 0, missing: 0, empty: 0 },
                columnCompleteness: {},
                completed: true,
                error: "No CSV data to verify"
            };
        }

        return new Promise<any>((resolve) => {
            setTimeout(() => {
                try {
                    // Find URL columns
                    const urlColumns = columnMappings
                        .filter(col => col.type === 'linkedin-url')
                        .map(col => col.columnName);

                    console.log("URL Columns for verification:", urlColumns);

                    // UPDATED: If no LinkedIn URL columns are found, set verification failed state
                    if (urlColumns.length === 0) {
                        console.log("No LinkedIn URL columns found for verification");
                        setVerificationFailed("No LinkedIn URL column mapped for verification. Please map at least one column as LinkedIn URL.");

                        // Return empty results
                        resolve({
                            urlsVerified: { valid: 0, invalid: 0, invalidUrls: [] },
                            customVariables: { present: 0, missing: 0, empty: 0 },
                            columnCompleteness: {},
                            completed: true,
                            error: "No LinkedIn URL columns mapped"
                        });
                        return;
                    }

                    // Find custom variable columns (tags in this case)
                    const tagColumns = columnMappings
                        .filter(col => col.type === 'tags')
                        .map(col => col.columnName);

                    console.log("Tag columns for verification:", tagColumns);

                    // Count total rows for calculations
                    const totalRows = parsedCsvData.length;
                    console.log("Total rows to verify:", totalRows);

                    // URL verification
                    const urlVerificationResults = {
                        valid: 0,
                        invalid: 0,
                        invalidUrls: [] as { row: number, url: string }[]
                    };

                    // Process URLs if we have parsed data and URL columns
                    if (parsedCsvData.length > 0 && urlColumns.length > 0) {
                        // Display some sample data for debugging
                        console.log("Sample row data for URL verification:",
                            urlColumns.map(col => ({
                                column: col,
                                samples: parsedCsvData.slice(0, 3).map(row => row[col])
                            }))
                        );

                        // Enhanced regex patterns for LinkedIn URLs with better support for variations
                        // This handles more country-specific domains, special characters, and tracking parameters
                        const linkedinProfileRegex = /^(?:https?:\/\/)?(?:www\.)?linkedin\.(?:com|co\.\w{2}|[a-z]{2,3})\/(?:in|profile)\/(?:[\w\-\.%+]+)\/?(?:[?#].*)?$/i;
                        const linkedinCompanyRegex = /^(?:https?:\/\/)?(?:www\.)?linkedin\.(?:com|co\.\w{2}|[a-z]{2,3})\/(?:company|school|organization)\/(?:[\w\-\.%+]+)\/?(?:[?#].*)?$/i;

                        parsedCsvData.forEach((row, rowIndex) => {
                            urlColumns.forEach(colName => {
                                const url = row[colName];

                                // Skip empty URLs
                                if (!url || url.trim() === '') {
                                    return;
                                }

                                // Normalize URL by trimming and ensuring it has protocol
                                let normalizedUrl = url.trim();
                                if (!/^https?:\/\//i.test(normalizedUrl)) {
                                    normalizedUrl = 'https://' + normalizedUrl;
                                }

                                // Check if URL matches either LinkedIn profile or company pattern
                                const isValidProfile = linkedinProfileRegex.test(normalizedUrl);
                                const isValidCompany = linkedinCompanyRegex.test(normalizedUrl);

                                // Additional check for obviously LinkedIn URLs that might not match the patterns
                                const isObviouslyLinkedIn = /linkedin\.(?:com|co)/i.test(normalizedUrl) &&
                                    (/\/in\//i.test(normalizedUrl) || /\/company\//i.test(normalizedUrl));

                                const isValid = isValidProfile || isValidCompany || isObviouslyLinkedIn;

                                if (isValid) {
                                    urlVerificationResults.valid++;
                                } else {
                                    urlVerificationResults.invalid++;
                                    urlVerificationResults.invalidUrls.push({
                                        row: rowIndex + 1,
                                        url: url
                                    });
                                }
                            });
                        });

                        console.log("URL verification results:", urlVerificationResults);
                    } else {
                        console.log("No URL data to verify - either no parsed data or no URL columns");
                    }

                    // Custom variables check
                    const customVarResults = {
                        present: 0,
                        missing: 0,
                        empty: 0
                    };

                    if (parsedCsvData.length > 0 && tagColumns.length > 0) {
                        parsedCsvData.forEach(row => {
                            tagColumns.forEach(colName => {
                                if (colName in row) {
                                    if (row[colName] && row[colName].trim() !== '') {
                                        customVarResults.present++;
                                    } else {
                                        customVarResults.empty++;
                                    }
                                } else {
                                    customVarResults.missing++;
                                }
                            });
                        });
                    } else {
                        // Default values for when no tag columns exist
                        customVarResults.present = totalRows;
                    }

                    // Column completeness check
                    const completenessResults: Record<string, {
                        missing: number;
                        missingRows: number[];
                    }> = {};

                    // Check all mapped columns except those marked as do-not-import
                    columnMappings.forEach(col => {
                        if (col.type !== 'do-not-import') {
                            const missingRows: number[] = [];
                            let missingCount = 0;

                            parsedCsvData.forEach((row, rowIndex) => {
                                if (!row[col.columnName] || row[col.columnName].trim() === '') {
                                    missingCount++;
                                    if (missingRows.length < 3) { // Limit to first 3 for display
                                        missingRows.push(rowIndex + 1);
                                    }
                                }
                            });

                            if (missingCount > 0) {
                                completenessResults[col.columnName] = {
                                    missing: missingCount,
                                    missingRows: missingRows
                                };
                            }
                        }
                    });

                    // Create final verification results
                    const results = {
                        urlsVerified: urlVerificationResults,
                        customVariables: customVarResults,
                        columnCompleteness: completenessResults,
                        completed: true
                    };

                    console.log("Verification complete:", results);
                    // After processing URLs, update failure state if needed
                    if (urlColumns.length > 0 && urlVerificationResults.valid === 0) {
                        setVerificationFailed("No valid LinkedIn URLs were found. Please check your column mapping.");
                    }

                    resolve(results);
                } catch (error) {
                    console.error("Error during verification:", error);
                    resolve({
                        urlsVerified: { valid: 0, invalid: 0, invalidUrls: [] },
                        customVariables: { present: 0, missing: 0, empty: 0 },
                        columnCompleteness: {},
                        completed: true,
                        error: error instanceof Error ? error.message : "Unknown error during verification"
                    });
                }
            }, 1500);
        });
    };

    // Column mappings in exact sequence requested
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([{
        columnName: 'First Name',
        type: 'first-name',
        samples: ['John', 'Sarah', 'Michael', 'Emma']
    }, {
        columnName: 'Last Name',
        type: 'last-name',
        samples: ['Doe', 'Smith', 'Johnson', 'Wilson']
    }, {
        columnName: 'LinkedIn URL',
        type: 'linkedin-url',
        samples: ['linkedin.com/in/johndoe', 'linkedin.com/in/sarahsmith', 'linkedin.com/in/michaelj', 'linkedin.com/in/emmaw']
    }, {
        columnName: 'Headline',
        type: 'head-line',
        samples: ['Senior Developer at TechCorp', 'Marketing Manager', 'Product Designer', 'Sales Director']
    }, {
        columnName: 'Job Title',
        type: 'job-title',
        samples: ['Senior Software Engineer', 'Marketing Manager', 'Product Designer', 'Sales Director']
    }, {
        columnName: 'Location',
        type: 'location',
        samples: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA']
    }, {
        columnName: 'Company',
        type: 'company',
        samples: ['TechCorp', 'StartupInc', 'MegaCorp', 'BusinessCo']
    }, {
        columnName: 'Company Url',
        type: 'company-url',
        samples: ['TechCorp', 'StartupInc', 'MegaCorp', 'BusinessCo']
    }, {
        columnName: 'Email',
        type: 'email',
        samples: ['john@company.com', 'sarah@startup.io', 'michael@corp.net', 'emma@business.co']
    }, {
        columnName: 'Tags',
        type: 'tags',
        samples: ['VIP', 'Hot Lead', 'Enterprise', 'SMB']
    }]);

    // Initialize with default leads
    const [leads, setLeads] = useState<Lead[]>([{
        id: '1',
        firstName: 'CA',
        lastName: 'MadhuKumar',
        location: 'Mumbai, Maharashtra, India',
        jobTitle: 'Chartered Accountant',
        email: 'madhu@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }, {
        id: '2',
        firstName: 'Ankit',
        lastName: 'Mehta',
        location: 'Mumbai, Maharashtra, India',
        jobTitle: 'Partner at S.M.P. O...',
        email: 'ankit@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }, {
        id: '3',
        firstName: 'Ravi',
        lastName: 'Garg',
        location: 'Bangalore, Karnataka, India',
        jobTitle: 'Founder',
        email: 'ravi@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }, {
        id: '4',
        firstName: 'Hiral',
        lastName: 'Bhojani',
        location: 'Rajkot, Gujarat, India',
        jobTitle: 'Human Resources',
        email: 'hiral@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }, {
        id: '5',
        firstName: 'Trusha',
        lastName: 'Khatate',
        location: 'Mumbai, Maharashtra, India',
        jobTitle: 'Founder at Business',
        email: 'trusha@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }, {
        id: '6',
        firstName: 'Vikas',
        lastName: 'Tandon',
        location: 'Mumbai, Maharashtra, India',
        jobTitle: 'Musician | Founder',
        email: 'vikas@example.com',
        avatar: '/placeholder.svg',
        selected: false
    }]);

    // Updated type options with exact sequence and emojis
    const typeOptions = [{
        value: 'first-name',
        label: '🧑 First Name',
        icon: '🧑'
    }, {
        value: 'last-name',
        label: '👤 Last Name',
        icon: '👤'
    }, {
        value: 'linkedin-url',
        label: '🔗 LinkedIn URL',
        icon: '🔗'
    }, {
        value: 'company-url',
        label: '🔗 Company URL',
        icon: '🔗'
    }, {
        value: 'head-line',
        label: '📝 Headline',
        icon: '📝'
    }, {
        value: 'job-title',
        label: '💼 Job Title',
        icon: '💼'
    }, {
        value: 'location',
        label: '📍 Location',
        icon: '📍'
    }, {
        value: 'company',
        label: '🏢 Company',
        icon: '🏢'
    }, {
        value: 'email',
        label: '✉️ Email',
        icon: '✉️'
    }, {
        value: 'custom-variable',
        label: '⚙️ Custom Variable',
        icon: '⚙️'
    }, {
        value: 'do-not-import',
        label: '❌ Do Not Import',
        icon: '❌'
    }];

    // Parse CSV file and update column mappings
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Store the file reference
        setUploadedFile({
            name: file.name,
            size: `${formatFileSize(file.size)}`,
            processed: false,
            fileObject: file
        });

        // Also store in campaign store
        setLeadsFile(file);

        try {
            // Set loading state
            setIsLoading(true);

            // Send the raw file to backend for mapping suggestions
            const response = await getMappingSuggestions(file);
            const suggestedMappings = response.data.mappings;
            const parsedData = response.data.previewData || [];
            console.log("The response data is :", response);
            // Start local parsing for preview if backend didn't provide preview data
            if (!parsedData.length) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    // preview: 10, // Just parse a few rows for preview
                    complete: (results) => {
                        setParsedCsvData(results.data as any[]);
                    }
                });
            } else {
                // Use backend-provided preview data
                setParsedCsvData(parsedData);
            }

            console.log("The parsed csv data after parsing is:", parsedCsvData);

            // Update column mappings with backend suggestions if available
            if (suggestedMappings && suggestedMappings.length > 0) {
                setColumnMappings(suggestedMappings.map((mapping: any) => ({
                    columnName: mapping.columnName,
                    type: mapping.mappedType,
                    samples: mapping.samples || []
                })));
            } else {
                // Fall back to client-side mapping logic
                handleClientSideMapping(file);
            }

            setValidRowsCount(response.data.totalRows || parsedData.length);
            setUploadedFile(prev => prev ? { ...prev, processed: true } : null);
            setShowColumnMapping(true);
            setValidationComplete(true);

        } catch (error) {
            console.error('Error getting mapping suggestions:', error);

            // Fall back to client-side mapping on error
            handleClientSideMapping(file);

            toast({
                variant: "destructive",
                title: "Using local mapping",
                description: "Couldn't get mapping suggestions from server. Using local parsing instead."
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Update the matching logic in handleClientSideMapping
    const handleClientSideMapping = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data as any[];
                setParsedCsvData(parsedData);

                if (results.meta.fields && results.meta.fields.length > 0) {
                    // Improved header matching logic with more patterns
                    const newColumnMappings: ColumnMapping[] = results.meta.fields.map(header => {
                        let type = 'do-not-import';
                        const headerLower = header.toLowerCase();

                        // Improved LinkedIn URL detection
                        if (
                            headerLower.includes('linkedin') ||
                            headerLower.includes('profile url') ||
                            headerLower.includes('profile link') ||
                            (headerLower.includes('url') && headerLower.includes('profile')) ||
                            headerLower === 'url' || // Consider plain "url" as likely LinkedIn
                            headerLower === 'link' // Consider plain "link" as likely LinkedIn
                        ) {
                            type = 'linkedin-url';
                        }
                        // Other existing mapping logic
                        else if (headerLower.includes('first') || headerLower.includes('fname')) {
                            type = 'first-name';
                        } else if (headerLower.includes('last') || headerLower.includes('lname')) {
                            type = 'last-name';
                        } else if (headerLower.includes('headline')) {
                            type = 'head-line';
                        } else if (headerLower.includes('title') || headerLower.includes('role') || headerLower.includes('position')) {
                            type = 'job-title';
                        } else if (headerLower.includes('location') || headerLower.includes('city') || headerLower.includes('country')) {
                            type = 'location';
                        } else if (headerLower.includes('company') || headerLower.includes('employer') || headerLower.includes('organization')) {
                            type = 'company';
                        } else if (headerLower.includes('email')) {
                            type = 'email';
                        } else if (headerLower.includes('tag')) {
                            type = 'tags';
                        } else if (headerLower.includes('company') && (headerLower.includes('url')) && (!headerLower.includes('linkedin'))) {
                            type = 'company-url';
                        }
                        // Get sample data and look for LinkedIn-like patterns in the data
                        const samples = parsedData.slice(0, 4).map(row => row[header] || '').filter(Boolean);

                        // If the type is still do-not-import, check if samples look like LinkedIn URLs
                        if (type === 'do-not-import' && samples.length > 0) {
                            const linkedInPattern = /linkedin\.com\/in\//i;
                            if (samples.some(sample => linkedInPattern.test(sample))) {
                                type = 'linkedin-url';
                            }
                        }

                        return {
                            columnName: header,
                            type,
                            samples
                        };
                    });

                    // Check if tags field exists in the mappings
                    const hasTagsField = newColumnMappings.some(col => col.type === 'tags');

                    // If not, add a default tags field
                    if (!hasTagsField) {
                        newColumnMappings.push({
                            columnName: 'Tags (Not in CSV)',
                            type: 'tags',
                            samples: ['Add tags manually']
                        });
                    }

                    setColumnMappings(newColumnMappings);
                    setValidRowsCount(parsedData.length);
                }

                setUploadedFile(prev => prev ? { ...prev, processed: true } : null);
                setShowColumnMapping(true);
                setValidationComplete(true);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                toast({
                    variant: "destructive",
                    title: "Error parsing CSV",
                    description: error.message,
                });
                setUploadedFile(null);
            }
        });
    };

    // Helper function to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleChooseAnotherMethod = () => {
        setShowColumnMapping(false);
        setUploadedFile(null);
        setValidationComplete(false);
    };

    const handleColumnTypeChange = (columnIndex: number, newType: string) => {
        // If fixing LinkedIn URL mapping, clear verification error and re-enable verification
        if (verificationFailed && newType === 'linkedin-url') {
            setVerificationFailed(null);

            // Re-enable verification to show "VERIFY & UPLOAD" button
            setVerifySettings(prev => ({
                ...prev,
                verifyLeads: true
            }));
        }

        // If user is trying to set a column to linkedin-url
        if (newType === 'linkedin-url') {
            // Check if any other column is already mapped as linkedin-url
            const existingLinkedInUrlIndex = columnMappings.findIndex(
                (col, idx) => col.type === 'linkedin-url' && idx !== columnIndex
            );

            if (existingLinkedInUrlIndex !== -1) {
                // Show error toast if another column is already mapped as linkedin-url
                toast({
                    title: "LinkedIn URL already mapped",
                    description: `Column "${columnMappings[existingLinkedInUrlIndex].columnName}" is already mapped as LinkedIn URL. Only one column can be used for LinkedIn profiles.`,
                    variant: "destructive",
                });
                return; // Prevent the change
            }
        }

        // For all other columns and valid types, proceed as normal
        setColumnMappings(prev => prev.map((col, index) => index === columnIndex ? {
            ...col,
            type: newType
        } : col));
    };

    const handleVerifyLeads = () => {
        setVerificationFailed(null);
        setValidationComplete(true);
        toast({
            title: "Leads Verified",
            description: `${validRowsCount} valid leads detected.`,
        });
    };

    // Update the continueAfterVerification function
    const continueAfterVerification = async () => {
        if (!parsedCsvData.length || !verificationResults) {
            toast({
                variant: "destructive",
                title: "No data to process",
                description: "Verification results are missing.",
            });
            return;
        }

        try {
            // Find URL column names
            const urlColumnNames = columnMappings
                .filter(col => col.type === 'linkedin-url')
                .map(col => col.columnName);

            // UPDATED: If no LinkedIn URL columns are mapped, treat as a complete verification failure
            if (urlColumnNames.length === 0) {
                console.log("No LinkedIn URL columns mapped - verification failed");

                // Show error toast
                toast({
                    variant: "destructive",
                    title: "LinkedIn URL column required",
                    description: "Verification requires at least one column mapped as LinkedIn URL. Please update your column mapping.",
                });

                // Set verification failed state
                setVerificationFailed("No LinkedIn URL column mapped for verification. Please map at least one column as LinkedIn URL.");

                // Clear verification results
                setVerificationResults(null);

                return; // Prevent continuing with upload
            }

            // Check if there are any valid LinkedIn URLs found during verification
            if (verificationResults.urlsVerified.valid === 0 && urlColumnNames.length > 0) {
                // No valid LinkedIn URLs were found, but a column was mapped as LinkedIn URL
                toast({
                    variant: "destructive",
                    title: "No valid LinkedIn URLs",
                    description: "Your mapped LinkedIn URL column doesn't contain any valid LinkedIn URLs. Please check your column mapping.",
                });
                return; // Prevent continuing with upload
            }

            // Get the list of row indexes with invalid URLs
            const invalidRowIndexes = new Set(
                verificationResults.urlsVerified.invalidUrls.map(item => item.row - 1) // -1 because rows are 1-indexed in results
            );

            console.log(`Found ${invalidRowIndexes.size} invalid URLs out of ${parsedCsvData.length} rows`);

            // Filter out rows with invalid LinkedIn URLs
            const filteredData = parsedCsvData.filter((row, index) => !invalidRowIndexes.has(index));

            console.log(`After filtering: ${filteredData.length} valid leads remaining`);

            // IMPORTANT: Store the filtered data for use by handleUploadAll
            // Use this approach to completely replace parsedCsvData with filteredData
            setParsedCsvData(filteredData);

            // Update validation counts
            setValidRowsCount(filteredData.length);

            // Clear verification results immediately
            setVerificationResults(null);

            // Turn off verification flag
            setVerifySettings(prev => ({
                ...prev,
                verifyLeads: false
            }));

            // Show toast with filtering results
            toast({
                title: "Leads Filtered",
                description: `Removed ${invalidRowIndexes.size} leads with invalid LinkedIn URLs. Continuing with ${filteredData.length} valid leads.`,
            });

            // Now call handleUploadAll - this will use the filtered data because we updated parsedCsvData
            handleUploadAll();
        } catch (error) {
            console.error('Error filtering invalid URLs:', error);
            toast({
                variant: "destructive",
                title: "Error filtering data",
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    };

    // Process the data according to column mappings and update the store
    const handleUploadAll = async () => {
        // Prevent upload if verification failed
        if (verificationFailed) {
            toast({
                variant: "destructive",
                title: "Cannot upload leads",
                description: verificationFailed,
            });
            return;
        }

        // Existing validation
        if (!parsedCsvData.length || !columnMappings.length) {
            toast({
                variant: "destructive",
                title: "No data to process",
                description: "Please upload a valid CSV file first.",
            });
            return;
        }

        // Check if any column is mapped as LinkedIn URL
        const hasLinkedInUrlColumn = columnMappings.some(col => col.type === 'linkedin-url');

        // If verification is enabled but no LinkedIn column is mapped, show warning
        if (verifySettings.verifyLeads && !hasLinkedInUrlColumn) {
            toast({
                variant: "destructive",
                title: "LinkedIn URL column not found",
                description: "To verify leads, you need to map at least one column as LinkedIn URL. Verification will be skipped.",
            });
            // Turn off lead verification since there's no LinkedIn URL to verify
            setVerifySettings(prev => ({
                ...prev,
                verifyLeads: false
            }));
        }

        // Set the upload flag when upload starts
        setUploadInitiated(true);

        // IMPORTANT: This check prevents infinite loop
        // If verification results exist, we shouldn't verify again
        const shouldVerify = verifySettings.verifyLeads && !verificationResults;

        // Check if verification is requested
        if (shouldVerify) {
            setIsVerifying(true);

            try {
                // Perform verification
                const results = await verifyLeadData();

                // CRITICAL: Check before setting verification results
                // If user mapped a LinkedIn URL column but no valid URLs were found, block the upload
                const hasLinkedInUrlColumn = columnMappings.some(col => col.type === 'linkedin-url');
                if (hasLinkedInUrlColumn && results.urlsVerified.valid === 0) {
                    toast({
                        variant: "destructive",
                        title: "LinkedIn URL validation failed",
                        description: "No valid LinkedIn URLs were found in your data. Please check your column mapping.",
                    });
                    setIsVerifying(false);
                    return; // Stop the upload process immediately
                }

                setVerificationResults(results);
                setIsVerifying(false);
                // Modal will be displayed automatically when verificationResults is set
            } catch (error) {
                console.error('Error during verification:', error);
                toast({
                    variant: "destructive",
                    title: "Verification failed",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                });
                setIsVerifying(false);
            }
            return; // Exit early - will continue after modal interaction
        }

        // Continue with normal upload if verification isn't requested
        try {
            setIsProcessing(true);

            // Create a mapping object to send back to backend
            const mappingInfo = {
                columnMappings: columnMappings.map(col => ({
                    columnName: col.columnName,
                    mappedType: col.type
                })),
                fileName: uploadedFile?.name,
                // Add filtering information
                filtering: {
                    urlsFiltered: verifySettings.verifyLeads,
                    originalRowCount: uploadedFile?.processed ? validRowsCount : parsedCsvData.length,
                    filteredRowCount: parsedCsvData.length
                }
            };

            // IMPORTANT: Here we're sending parsedCsvData which has been filtered if verification happened
            const response = await processLeadsWithMapping(uploadedFile?.fileObject as File, mappingInfo, parsedCsvData);


            console.log('Backend response:', response.data.leadListId);

            const leadListId = response.data.leadListId;
            // Get processed lead data from backend
            const processedData = response.data.processedLeads || [];

            // Filter out invalid LinkedIn URLs from the processed data
            const linkedinProfileRegex = /^(?:https?:\/\/)?(?:www\.)?linkedin\.(?:com|co\.\w{2}|[a-z]{2})\/in\/.+$/i;
            const linkedinCompanyRegex = /^(?:https?:\/\/)?(?:www\.)?linkedin\.(?:com|co\.\w{2}|[a-z]{2})\/company\/.+$/i;

            const originalCount = processedData.length;
            const filteredProcessedData = processedData.filter(item => {
                // If there's no LinkedIn URL, keep the lead
                if (!item.linkedinUrl) return true;

                // Check if the URL matches either regex pattern
                const isValidProfile = linkedinProfileRegex.test(item.linkedinUrl);
                const isValidCompany = linkedinCompanyRegex.test(item.linkedinUrl);

                return isValidProfile || isValidCompany;
            });

            console.log(`Filtered ${originalCount - filteredProcessedData.length} leads with invalid LinkedIn URLs`);
            console.log("Final processed data:", filteredProcessedData);

            // If backend processing failed, fall back to client-side processing
            if (!filteredProcessedData.length) {
                console.log("Falling back to client-side processing");
                return handleClientSideProcessing();
            }

            // Convert processed data to Lead format for display (use the filtered data)
            const formattedLeads: Lead[] = filteredProcessedData.map((item: any) => ({
                id: item.id || `imported-${nanoid()}`,
                firstName: item.firstName || 'Unknown',
                lastName: item.lastName || 'User',
                headline: item.headline,
                jobTitle: item.jobTitle,
                company: item.company,
                location: item.location,
                email: item.email,
                avatar: getRandomProfileImage(), // Use random profile image
                selected: false,
                linkedinUrl: item.linkedinUrl,
            }));


            // Update the toast message to include filtering info
            const removedCount = originalCount - filteredProcessedData.length;
            const filterMessage = removedCount > 0
                ? ` (${removedCount} leads with invalid LinkedIn URLs were filtered out)`
                : '';

            // Update the local leads state
            setLeads(formattedLeads);

            // Create leads data object for store (use filtered data)
            const leadsData = {
                file: uploadedFile?.fileObject || null,
                fileName: uploadedFile?.name,
                data: filteredProcessedData, // Use filtered data here
                rowCount: filteredProcessedData.length,
                s3Url: response.data.s3Url || null,
                uploadedAt: new Date().toISOString(),
                leadListId: response.data.leadListId
            };

            // Update parent and store
            if (updateLeads) {
                updateLeads(leadsData);
            }
            setLeadsData(leadsData);

            toast({
                title: "Leads Successfully Imported",
                description: `${filteredProcessedData.length} leads are ready for your campaign${filterMessage}.`,
            });

            setShowLeadsGrid(true);
            setShowColumnMapping(false);

        } catch (error) {
            console.error('Error processing CSV data:', error);
            toast({
                variant: "destructive",
                title: "Error processing data",
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });

            // Fall back to client-side processing if backend fails
            handleClientSideProcessing();
        } finally {
            setIsProcessing(false);
        }
    };

    // Add this fallback function for client-side processing
    const handleClientSideProcessing = () => {
        // This contains your existing processing logic from the current handleUploadAll

        // Create a mapping from column names to their types
        const typeMapping = columnMappings.reduce((acc: Record<string, string>, col) => {
            acc[col.columnName] = col.type;
            return acc;
        }, {});

        // Transform the parsed data according to the mappings
        const processedData = parsedCsvData.map((row, index) => {
            // Your existing row processing logic
            const processedRow: Record<string, any> = {
                id: `imported-${nanoid()}`,
            };

            // Process each field according to its mapped type
            Object.keys(row).forEach(key => {
                const type = typeMapping[key];
                if (type && type !== 'do-not-import') {
                    switch (type) {
                        case 'first-name':
                            processedRow.firstName = row[key];
                            break;
                        case 'last-name':
                            processedRow.lastName = row[key];
                            break;
                        case 'linkedin-url':
                            processedRow.linkedinUrl = row[key];
                            break;
                        case 'job-title':
                            processedRow.jobTitle = row[key];
                            break;
                        case 'company':
                            processedRow.company = row[key];
                            break;
                        case 'location':
                            processedRow.location = row[key];
                            break;
                        case 'email':
                            processedRow.email = row[key];
                            break;
                        case 'head-line':
                            processedRow.headline = row[key];
                            break;
                        case 'tags':
                            processedRow.tags = row[key];
                            break;

                        case 'company-url':
                            processedRow.companyUrl = row[key];
                        default:
                            // For custom variables or unrecognized types
                            processedRow[key] = row[key];
                    }
                }
            });

            // Make sure we always have first and last name fields
            if (!processedRow.firstName) processedRow.firstName = 'Unknown';
            if (!processedRow.lastName) processedRow.lastName = 'User';

            // Add default avatar
            processedRow.avatar = getRandomProfileImage();

            // Initialize selected to false
            processedRow.selected = false;

            return processedRow;
        });

        // Convert processed data to Lead format
        const formattedLeads: Lead[] = processedData.map(item => ({
            id: item.id,
            firstName: item.firstName || 'Unknown',
            lastName: item.lastName || 'User',
            headline: item.headline,
            jobTitle: item.jobTitle,
            company: item.company,
            location: item.location,
            email: item.email,
            avatar: getRandomProfileImage(), // Use random profile image
            selected: false,
            linkedinUrl: item.linkedinUrl,
        }));

        // Update the local leads state with the processed data
        setLeads(formattedLeads);

        // Create a processed data object to update both the parent and the store
        const leadsData = {
            file: uploadedFile?.fileObject || null,  // Use the stored file reference
            fileName: uploadedFile?.name,
            data: processedData,
            rowCount: processedData.length,
            s3Url: null,
            uploadedAt: new Date().toISOString()
        };

        console.log("Uploading leads with file reference:", leadsData.file ? "File present" : "File missing");

        // Update the parent component with the processed data (for backward compatibility)
        if (updateLeads) {
            updateLeads(leadsData);
        }

        // Update the campaign store with the leads data
        setLeadsData(leadsData);

        // Show success and transition to the grid view
        toast({
            title: "Leads Successfully Imported",
            description: `${processedData.length} leads are ready for your campaign.`,
        });

        setShowLeadsGrid(true);
        setShowColumnMapping(false);

        console.log('Leads data processed and saved to campaign store', leadsData);
    };

    const handleImportList = () => {
        if (selectedList) {
            // Create a leads data object
            const leadsData = {
                fileName: selectedList,
                data: leads,
                rowCount: leads.length,
                s3Url: null,
                uploadedAt: new Date().toISOString()
            };

            // Update parent (for backward compatibility)
            if (updateLeads) {
                updateLeads(leadsData);
            }

            // Update the campaign store with the imported list
            setLeadsData(leadsData);

            toast({
                title: "List Imported",
                description: `${leads.length} leads imported from ${selectedList}.`,
            });

            setShowLeadsGrid(true);

            console.log('List imported and saved to campaign store', leadsData);
        }
    };

    // Update the handleCloseVerificationModal function 
    const handleCloseVerificationModal = () => {
        // Check if we had a verification with zero valid URLs
        if ((verificationResults && verificationResults.urlsVerified.valid === 0) ||
            !columnMappings.some(col => col.type === 'linkedin-url')) {

            // First clear verification results
            setVerificationResults(null);

            // Set verification failed state
            setTimeout(() => {
                const message = !columnMappings.some(col => col.type === 'linkedin-url')
                    ? "No LinkedIn URL column mapped for verification. Please map at least one column as LinkedIn URL."
                    : "No valid LinkedIn URLs were found. Please check your column mapping.";

                setVerificationFailed(message);

                // IMPORTANT: When closing with errors, reset verification settings to true
                // so button shows "VERIFY & UPLOAD" again
                setVerifySettings(prev => ({
                    ...prev,
                    verifyLeads: true
                }));

                console.log("Verification failed state set, re-enabled verification");
            }, 50);
        } else {
            // Clear the verification results
            setVerificationResults(null);
        }
    };

    const handleLeadSelect = (leadId: string, checked: boolean) => {
        setLeads(leads.map(lead => lead.id === leadId ? {
            ...lead,
            selected: checked
        } : lead));
    };

    const handleSelectAll = (checked: boolean) => {
        setLeads(leads.map(lead => ({
            ...lead,
            selected: checked
        })));
    };

    const selectedCount = leads.filter(lead => lead.selected).length;
    const totalCount = leads.length;
    const allSelected = selectedCount === totalCount && totalCount > 0;

    // Download sample CSV template
    const handleDownloadSample = () => {
        const sampleData = [
            { firstName: 'John', lastName: 'Doe', linkedinUrl: 'https://linkedin.com/in/johndoe', email: 'john@example.com', company: 'Acme Inc.', position: 'CEO' },
            { firstName: 'Jane', lastName: 'Smith', linkedinUrl: 'https://linkedin.com/in/janesmith', email: 'jane@example.com', company: 'Tech Corp', position: 'CTO' },
        ];

        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'leads_template.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // Check for existing leads in the store when component mounts
    useEffect(() => {
        // If we have leads data in the store, use it and show the grid
        if (storeLeads && (storeLeads.campaign.leads.data || []).length > 0) {
            console.log('Found existing leads in store:', storeLeads);

            // Convert store leads to the format needed by the component
            const formattedLeads: Lead[] = (storeLeads.campaign.leads.data || []).map((item: any) => ({
                id: item.id || `store-${nanoid()}`,
                firstName: item.firstName || 'Unknown',
                lastName: item.lastName || 'User',
                headline: item.headline,
                jobTitle: item.jobTitle,
                company: item.company,
                location: item.location,
                email: item.email,
                avatar: getRandomProfileImage(),
                selected: false,
                linkedinUrl: item.linkedinUrl,
            }));

            //   // Update file info if available
            //   if (storeLeads.campaign.leads.fileName) {
            //     setUploadedFile({
            //       name: storeLeads.campaign.leads.fileName,
            //       size: `${(storeLeads.campaign.leads.data || []).length} leads`,
            //       processed: true,
            //       // fileObject will be null since we don't have the actual file object
            //     });
            //   }


            // Update the local leads state
            setLeads(formattedLeads);
            setValidRowsCount(formattedLeads.length);

            // Show the leads grid view
            setShowLeadsGrid(true);
        }
    }, [storeLeads]);

    // Filter leads based on search query
    const filteredLeads = useMemo(() => {
        if (!searchQuery.trim()) {
            return leads;
        }

        const query = searchQuery.toLowerCase().trim();

        return leads.filter(lead => {
            return (
                (lead.firstName?.toLowerCase().includes(query)) ||
                (lead.lastName?.toLowerCase().includes(query)) ||
                (lead.jobTitle?.toLowerCase().includes(query)) ||
                (lead.company?.toLowerCase().includes(query)) ||
                (lead.location?.toLowerCase().includes(query)) ||
                (lead.email?.toLowerCase().includes(query)) ||
                (lead.headline?.toLowerCase().includes(query))
            );
        });
    }, [leads, searchQuery]);

    // Column mapping view
    if (showColumnMapping && uploadedFile) {
        return <div className="space-y-6">
            {/* File Upload Success */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                        <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                        <p className="text-sm text-gray-500">{uploadedFile.size} • File processed</p>
                    </div>
                </div>
            </div>

            {/* Choose Another Method Button - Moved to left */}
            <div className="flex justify-start">
                <button onClick={handleChooseAnotherMethod} className="flex items-center justify-start space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Choose another method</span>
                </button>
            </div>

            {/* Column Mapping Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Map CSV Columns</h2>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Column Name</TableHead>
                                <TableHead>Select Type</TableHead>
                                <TableHead>Sample Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {columnMappings.map((column, index) => <TableRow key={index}>
                                <TableCell className="font-medium">{column.columnName}</TableCell>
                                <TableCell>
                                    <Select value={column.type} onValueChange={value => handleColumnTypeChange(index, value)}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                                            {typeOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        {column.samples.slice(0, 3).map((sample, sampleIndex) => <div key={sampleIndex} className={`text-xs px-2 py-1 rounded ${column.type === 'email' ? 'bg-blue-50 text-blue-700' : column.type === 'location' ? 'bg-green-50 text-green-700' : column.type === 'linkedin-url' ? 'bg-purple-50 text-purple-700' : column.type === 'company' ? 'bg-orange-50 text-orange-700' : column.type === 'job-title' ? 'bg-indigo-50 text-indigo-700' : column.type === 'head-line' ? 'bg-pink-50 text-pink-700' : column.type === 'tags' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>
                                            {sample}
                                        </div>)}
                                    </div>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </div>

                {/* Verification Controls */}
                <div className="mt-8 space-y-6">
                    {/* Check for duplicates section */}
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="text-sm font-medium text-gray-900">Check for duplicates across all</span>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={verifySettings.checkDuplicates.campaigns} onCheckedChange={checked => setVerifySettings(prev => ({
                                        ...prev,
                                        checkDuplicates: {
                                            ...prev.checkDuplicates,
                                            campaigns: checked as boolean
                                        }
                                    }))} />
                                    <span className="text-sm text-gray-700">Campaigns</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={verifySettings.checkDuplicates.lists} onCheckedChange={checked => setVerifySettings(prev => ({
                                        ...prev,
                                        checkDuplicates: {
                                            ...prev.checkDuplicates,
                                            lists: checked as boolean
                                        }
                                    }))} />
                                    <span className="text-sm text-gray-700">Lists</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={verifySettings.checkDuplicates.workspace} onCheckedChange={checked => setVerifySettings(prev => ({
                                        ...prev,
                                        checkDuplicates: {
                                            ...prev.checkDuplicates,
                                            workspace: checked as boolean
                                        }
                                    }))} />
                                    <span className="text-sm text-gray-700">The Workspace</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verify leads section */}
                    {/* <div className="flex items-center space-x-3 mb-6">
                        <Checkbox checked={verifySettings.verifyLeads} onCheckedChange={checked => setVerifySettings(prev => ({
                            ...prev,
                            verifyLeads: checked as boolean
                        }))} />
                        <span className="text-sm font-medium text-gray-900">Verify leads</span>
                        <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">⚡ 0.25 / Row</span>
                    </div> */}

                    {/* Verification Results */}
                    {verificationResults && (
                        <VerificationResultsModal
                            open={!!verificationResults}
                            onClose={handleCloseVerificationModal} // Use the new handler
                            onContinue={continueAfterVerification}
                            results={verificationResults}
                            totalRows={parsedCsvData.length}
                            continueEnabled={uploadInitiated}
                        />
                    )}

                    {/* Verification Loading State */}
                    {isVerifying && (
                        <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg">
                            <div className="animate-spin mr-3">
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium">Verifying {parsedCsvData.length} leads</div>
                                <div className="text-sm">This may take a moment</div>
                            </div>
                        </div>
                    )}

                    {/* Results and Upload */}
                    <div className="flex flex-col items-center space-y-4">
                        {isLoading && <div className="flex items-center space-x-2 text-blue-600">
                            <span className="loading loading-spinner"></span>
                            <span className="text-sm font-medium">Processing CSV data...</span>
                        </div>}

                        {validationComplete && !verificationFailed && (
                            <div className="flex items-center space-x-2 text-green-600 mb-4">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Detected {validRowsCount} data rows</span>
                            </div>
                        )}

                        {/* Add verification failure message */}
                        {verificationFailed && (
                            <div className="flex items-center space-x-2 text-red-600 mb-4 bg-red-50 p-4 rounded-lg w-full">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Verification Failed</p>
                                    <p className="text-xs">{verificationFailed}</p>
                                    <p className="text-xs mt-1">
                                        Look for columns containing LinkedIn profile URLs (like linkedin.com/in/username) and map them as "LinkedIn URL".
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleUploadAll}
                            className={`px-8 py-3 text-base font-medium rounded-lg ${verificationFailed
                                ? "bg-gray-300 text-gray-600 hover:bg-gray-300 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 text-white"
                                }`}
                            disabled={isProcessing || isVerifying || !!verificationFailed}
                        >
                            {isProcessing ? (
                                <div className="flex items-center space-x-2">
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>PROCESSING...</span>
                                </div>
                            ) : isVerifying ? (
                                <div className="flex items-center space-x-2">
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>VERIFYING...</span>
                                </div>
                            ) : verificationResults ? (
                                'UPLOAD VERIFIED LEADS'
                            ) : verifySettings.verifyLeads ? (
                                'VERIFY & UPLOAD'
                            ) : (
                                'UPLOAD ALL'
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Quality Warnings */}
            <div className="mt-4">
                {columnMappings.some(col => col.type === 'linkedin-url') &&
                    columnMappings.filter(col => col.type === 'linkedin-url').some(col => {
                        // Count how many rows have empty values for this column
                        const emptyCount = parsedCsvData.filter(row => !row[col.columnName] || row[col.columnName].trim() === '').length;
                        return emptyCount > 0;
                    }) && (
                        <div className="bg-yellow-50 p-4 rounded-md mb-4">
                            <h3 className="text-sm font-medium text-yellow-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Missing LinkedIn URLs Detected
                            </h3>
                            <p className="text-xs text-yellow-700 mt-1">
                                Some rows in your data have missing LinkedIn URLs. These leads may fail verification or have limited functionality.
                            </p>
                        </div>
                    )}
            </div>
        </div>;
    }

    // Leads grid view
    if (showLeadsGrid) {
        return <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                {searchQuery.trim() ? `${filteredLeads.length}/${totalCount}` : `${totalCount} leads`}
                            </span>
                        </div>

                        {/* <Select>
                            <SelectTrigger className="w-32">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="founder">Founder</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="director">Director</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mumbai">Mumbai</SelectItem>
                                <SelectItem value="bangalore">Bangalore</SelectItem>
                                <SelectItem value="delhi">Delhi</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select>
                            <SelectTrigger className="w-28">
                                <SelectValue placeholder="Tags" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hot">Hot</SelectItem>
                                <SelectItem value="warm">Warm</SelectItem>
                                <SelectItem value="cold">Cold</SelectItem>
                            </SelectContent> */}
                        {/* </Select> */}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                            <span className="text-sm text-gray-600">Select All</span>
                        </div>

                        {/* {selectedCount > 0 && <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                            <Button variant="outline" size="sm">Export</Button>
                            <Button variant="outline" size="sm">Reassign to Sequence</Button>
                        </div>} */}
                    </div>
                </div>
            </div>

            {/* Leads Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeads.map(lead =>
                        <div key={lead.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${lead.selected ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-start space-x-3">
                                <Checkbox className='mt-4' checked={lead.selected} onCheckedChange={checked => handleLeadSelect(lead.id, checked as boolean)} />
                                <img src={lead.avatar} alt={`${lead.firstName} ${lead.lastName}`} className="w-12 h-12 rounded-full bg-gray-200 object-cover" onError={(e) => {
                                    // Fallback to placeholder if image fails to load
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {lead.firstName} {lead.lastName}
                                    </h3>

                                    {/* Display available details in a prioritized order */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        {[
                                            lead.headline && <span key="headline" className="block text-gray-600">{lead.headline}</span>,
                                            (lead.jobTitle || lead.company) &&
                                            <span key="position" className="block">
                                                {[lead.jobTitle, lead.company].filter(Boolean).join(" at ")}
                                            </span>,
                                            lead.location && <span key="location" className="block">{lead.location}</span>
                                        ].filter(Boolean)}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    {/* <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-1">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                                        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                                        <DropdownMenuItem>Remove</DropdownMenuItem>
                                    </DropdownMenuContent> */}
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>

                {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No leads match your search criteria</p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {/* <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Targets</span>
                        <span className="text-sm text-gray-600">
                            {searchQuery.trim() ? `${filteredLeads.length} / ${totalCount}` : `${totalCount} / 250`}
                        </span>
                    </div>
                    <Progress value={totalCount / 250 * 100} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">100%</p>
                </div>
            </div> */}
        </div>;
    }

    // Default two-column layout
    return <div className="flex justify-center">
        {/* CSV Upload Section - centered and wider */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload Leads CSV</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                    Drag and drop your CSV file here, or click to browse
                </p>
                <div className="relative">
                    <Button variant="outline" className="mx-auto">Browse files</Button>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
                <p>Max size: 5MB | Required columns: Name, Email, LinkedIn URL</p>
                <button
                    onClick={handleDownloadSample}
                    className="text-primary hover:underline inline-flex items-center mt-2 mx-auto"
                >
                    <Download className="w-4 h-4 mr-1" />
                    Download Sample CSV
                </button>
            </div>
        </div>

        {/* Right Column: Existing Lists */}
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Use Previous Lead Lists</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a List
                    </label>
                    <Select value={selectedList} onValueChange={setSelectedList}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a list..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="product-hunt">Product Hunt Leads</SelectItem>
                            <SelectItem value="sales-demos">Sales Demos</SelectItem>
                            <SelectItem value="vc-outreach">VC Outreach</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {selectedList && <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview (first 3 leads):</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium">John Doe</span>
                            <span className="text-sm text-gray-500">john@example.com</span>
                        </div>
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Jane Smith</span>
                            <span className="text-sm text-gray-500">jane@example.com</span>
                        </div>
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Mike Johnson</span>
                            <span className="text-sm text-gray-500">mike@example.com</span>
                        </div>
                    </div>
                </div>}

                <Button onClick={handleImportList} disabled={!selectedList} className="w-full mt-6">
                    Import List
                </Button>
            </div>
        </div> */}
    </div >;
};

export default ListOfLeads;

// Add this function near the top of your file with other helper functions
const getRandomProfileImage = () => {
    // Total number of profile images available (user1.png through user13.png)
    const totalImages = 13;
    const randomIndex = Math.floor(Math.random() * totalImages) + 1;
    return `/profileImages/user${randomIndex}.png`;
};

// Add this function near your other handler functions


