import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageCircle, Plus, Trash2, UserPlus, MoreHorizontal, User, X, Save, Eye, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; // Add this import
import { Label } from '@/components/ui/label'; // Add this import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CampaignStepType } from '@/types/campaigns';
import isEqual from 'lodash/isEqual';
import { useCampaignStore } from '@/api/store/campaignStore/campaign';
import { getMessageVariables, Variable } from '@/api/variables';
import { useQuery } from '../../common/api/use-query';
import { getCampaignVariables } from '@/api/variables';

interface SequenceStep {
    id: string;
    type: 'connection' | 'delay' | 'followup';
    content?: string;
    delay?: { days: number; hours: number; minutes: number }; // Add minutes here
    status?: 'accepted' | 'pending';
    groupId?: string;
    connectionMessage?: string;
}

interface SequenceProps {
    workflowData?: any;
    updateWorkflow: (workflow: any) => void;
    operationalTimes?: any;
    updateOperationalTimes?: (times: any) => void;
    viewMode?: boolean; // Added viewMode prop
}

const Sequence: React.FC<SequenceProps> = ({
    workflowData,
    updateWorkflow,
    viewMode = false
}) => {
    // Get campaign info from store

    const { campaign } = useCampaignStore();
    const leadListId = campaign?.leads?.leadListId || campaign?.leadListId;
    // Add state for variables and preview
    const [variables, setVariables] = useState<Variable[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('');
    const [previewStepId, setPreviewStepId] = useState<string | null>(null);
    const [leadListName, setLeadListName] = useState<string>('');
    const [totalLeads, setTotalLeads] = useState<number>(0);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
        campaign?.senderAccounts?.[0]?.id || null
    );
    // Fetch campaign-specific variables if leadListId is available
    const { data: variablesData, isLoading: variablesLoading } = useQuery({
        queryKey: ['campaignVariables', leadListId],
        queryFn: () => getCampaignVariables(leadListId as string),
        options: {
            staleTime: 1000 * 60 * 60, // Cache for 1 hour
            enabled: !!leadListId // Only run query if leadListId exists
        }
    });

    // Add this useEffect to handle the data when it arrives
    useEffect(() => {
        if (variablesData) {
            setVariables(variablesData || []);
        }
    }, [variablesData]);

    // Use campaign store - only setConfigs is relevant here
    const { setConfigs } = useCampaignStore();

    const isUpdatingRef = useRef(false);


    // Helper function to get premium status and character limit
    const getSelectedAccountInfo = () => {
        const selectedAccount = campaign?.senderAccounts?.find(
            acc => acc.id === selectedAccountId
        ) || campaign?.senderAccounts?.[0];

        const isPremium = selectedAccount?.isPremium || false;
        const CHARACTER_LIMIT = isPremium ? 300 : 200;

        return { selectedAccount, isPremium, CHARACTER_LIMIT };
    };

    // Group accounts by premium status
    const groupedAccounts = React.useMemo(() => {
        const accounts = campaign?.senderAccounts || [];
        return {
            premium: accounts.filter(acc => acc.isPremium),
            standard: accounts.filter(acc => !acc.isPremium)
        };
    }, [campaign?.senderAccounts]);

    console.log("The campaign Data is :", campaign);

    const [steps, setSteps] = useState<SequenceStep[]>(
        workflowData && workflowData.steps && workflowData.steps.length > 0
            ? workflowData.steps.map((step: any, index: number) => {
                if (step.type === CampaignStepType.CONNECTION_REQUEST) {
                    // Connection request step
                    return {
                        id: `api-connection-${index}`,
                        type: 'connection',
                        status: 'accepted',
                        connectionMessage: step.data.message || ''
                    };
                }
                else if (step.type === CampaignStepType.FOLLOW_UP) {
                    // Follow-up message needs a delay step before it
                    const newGroupId = `api-group-${index}`;
                    // Calculate days, hours and minutes from seconds
                    const totalSeconds = step.data.delay ?? 0;
                    const days = Math.floor(totalSeconds / (24 * 60 * 60));
                    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
                    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

                    // Add delay step with minutes
                    const delayStep = {
                        id: `api-delay-${index}`,
                        type: 'delay',
                        delay: {
                            days,
                            hours,
                            minutes
                        },
                        groupId: newGroupId
                    };

                    // Add follow-up step
                    const followUpStep = {
                        id: `api-followup-${index}`,
                        type: 'followup',
                        content: step.data.message || '',
                        groupId: newGroupId
                    };

                    return [delayStep, followUpStep];
                }
            }).flat()
            : [
                {
                    id: '1',
                    type: 'connection',
                    status: 'accepted',
                    connectionMessage: ''
                },
                {
                    id: '2',
                    type: 'delay',
                    delay: { days: 1, hours: 0, minutes: 0 }, // Initialize with minutes
                    groupId: 'group-1'
                },
                {
                    id: '3',
                    type: 'followup',
                    content: 'Hi {first_name},\nThanks for connecting!',
                    groupId: 'group-1'
                }
            ]
    );

    const updateConnectionMessage = (stepId: string, message: string) => {
        if (viewMode) return; // Prevent updates in view mode

        setSteps(steps.map(step =>
            step.id === stepId ? { ...step, connectionMessage: message } : step
        ));
    };

    const [isConnectionMessageOpen, setIsConnectionMessageOpen] = useState(false);
    const [currentConnectionStep, setCurrentConnectionStep] = useState<SequenceStep | null>(null);
    const [excludeConnected, setExcludeConnected] = useState(
        workflowData?.excludeConnected || false
    );

    const getCharacterLimitColor = (currentLength: number, limit: number) => {
        const percentage = (currentLength / limit) * 100;
        if (percentage >= 90) return "text-red-500";
        if (percentage >= 70) return "text-amber-500";
        return "text-gray-500";
    };
    // Convert API workflow format to component steps format
    useEffect(() => {
        if (isUpdatingRef.current) {
            // Skip if we're currently in an update cycle
            return;
        }

        if (workflowData && workflowData.steps && workflowData.steps.length > 0) {
            const convertedSteps: SequenceStep[] = [];
            let currentGroupId = '';

            workflowData.steps.forEach((step: any, index: number) => {
                if (step.type === CampaignStepType.CONNECTION_REQUEST) {
                    // Connection request step
                    convertedSteps.push({
                        id: `api-connection-${index}`,
                        type: 'connection',
                        status: 'accepted',
                        connectionMessage: step.data.message || ''
                    });
                }
                else if (step.type === CampaignStepType.FOLLOW_UP) {
                    // Follow-up message needs a delay step before it
                    const newGroupId = `api-group-${index}`;

                    // Add delay step - FIX: Add minutes calculation
                    convertedSteps.push({
                        id: `api-delay-${index}`,
                        type: 'delay',
                        delay: {
                            days: Math.floor((step.data.delay ?? 0) / (24 * 60 * 60)),
                            hours: Math.floor(((step.data.delay ?? 0) % (24 * 60 * 60)) / (60 * 60)),
                            minutes: Math.floor(((step.data.delay ?? 0) % (60 * 60)) / 60) // Add minutes calculation
                        },
                        groupId: newGroupId
                    });

                    // Add follow-up step
                    convertedSteps.push({
                        id: `api-followup-${index}`,
                        type: 'followup',
                        content: step.data.message || '',
                        groupId: newGroupId
                    });
                }
            });

            if (convertedSteps.length > 0) {
                // Set flag before updating state
                isUpdatingRef.current = true;
                setSteps(convertedSteps);
                // Clear flag after state update
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
        }
    }, [workflowData]);

    // Update API workflow when steps change
    useEffect(() => {
        // Skip if we're currently in an update cycle from props or in view mode
        if (isUpdatingRef.current || viewMode) {
            return;
        }

        // Process steps to API format
        const apiSteps = [];

        // First, find the connection request step
        const connectionStep = steps.find(step => step.type === 'connection');
        if (connectionStep) {
            apiSteps.push({
                type: CampaignStepType.CONNECTION_REQUEST,
                data: {
                    message: connectionStep.connectionMessage || ''
                }
            });
        }

        // Then, process follow-up groups (delay + followup steps)
        const followUpGroups = new Map<string, { delay: SequenceStep, followUp: SequenceStep }>();

        // Collect delay and followup steps into groups
        steps.forEach(step => {
            if (step.groupId && (step.type === 'delay' || step.type === 'followup')) {
                if (!followUpGroups.has(step.groupId)) {
                    followUpGroups.set(step.groupId, { delay: null as unknown as SequenceStep, followUp: null as unknown as SequenceStep });
                }

                const group = followUpGroups.get(step.groupId)!;
                if (step.type === 'delay') {
                    group.delay = step;
                } else {
                    group.followUp = step;
                }
            }
        });

        // Convert each complete group to an API step
        followUpGroups.forEach((group, groupId) => {
            if (group.delay && group.followUp) {
                // Calculate delay in seconds - include minutes
                const delayInSeconds =
                    (group.delay.delay?.days || 0) * 24 * 60 * 60 +
                    (group.delay.delay?.hours || 0) * 60 * 60 +
                    (group.delay.delay?.minutes || 0) * 60;

                apiSteps.push({
                    type: CampaignStepType.FOLLOW_UP,
                    data: {
                        message: group.followUp.content || '',
                        delay: delayInSeconds
                    }
                });
            }
        });

        // Use a deep comparison to check if the workflow actually changed
        const newWorkflow = {
            steps: apiSteps,
            excludeConnected // Add this option to the workflow
        };

        // Only update if there's an actual change
        if (!isEqual(newWorkflow, workflowData)) {
            updateWorkflow(newWorkflow);
        }
    }, [steps, workflowData, viewMode, excludeConnected]);

    // Add this effect to update the campaign store when steps change
    useEffect(() => {
        // Skip if we're currently in an update cycle from props or in view mode
        if (isUpdatingRef.current || viewMode) {
            return;
        }

        // Create configs array in the API format
        const configs = [];

        // First, find the connection request step
        const connectionStep = steps.find(step => step.type === 'connection');
        if (connectionStep) {
            configs.push({
                id: 0,
                parentID: 0,
                action: "sendConnectionRequest",
                data: {
                    delay: 0,
                    text: connectionStep.connectionMessage || ""
                }
            });
        }

        // Then, process follow-up groups (delay + followup steps)
        const followUpGroups = new Map<string, { delay: SequenceStep, followUp: SequenceStep }>();

        // Collect delay and followup steps into groups
        steps.forEach(step => {
            if (step.groupId && (step.type === 'delay' || step.type === 'followup')) {
                if (!followUpGroups.has(step.groupId)) {
                    followUpGroups.set(step.groupId, { delay: null as unknown as SequenceStep, followUp: null as unknown as SequenceStep });
                }

                const group = followUpGroups.get(step.groupId)!;
                if (step.type === 'delay') {
                    group.delay = step;
                } else {
                    group.followUp = step;
                }
            }
        });

        // Convert each complete group to a config entry
        let followUpIndex = 1;
        followUpGroups.forEach((group, groupId) => {
            if (group.delay && group.followUp) {
                // Calculate delay in seconds - include minutes
                const delayInSeconds =
                    (group.delay.delay?.days || 0) * 24 * 60 * 60 +
                    (group.delay.delay?.hours || 0) * 60 * 60 +
                    (group.delay.delay?.minutes || 0) * 60;

                configs.push({
                    id: followUpIndex,
                    parentID: followUpIndex,
                    action: "sendFollowUp",
                    data: {
                        delay: delayInSeconds,
                        text: group.followUp.content || "",
                        excludeConnected: excludeConnected
                    }
                });

                followUpIndex++;
            }
        });

        // Update the campaign store with configs
        setConfigs(configs);

    }, [steps, setConfigs, viewMode, excludeConnected]);

    useEffect(() => {
        if (workflowData && !isUpdatingRef.current) {
            // Set the excludeConnected state if present in workflowData
            if (workflowData.excludeConnected !== undefined) {
                setExcludeConnected(workflowData.excludeConnected);
            }
        }
    }, [workflowData]);

    const addFollowUp = () => {
        if (viewMode) return; // Prevent in view mode

        const groupId = `group-${Date.now()}`;

        const delayStep: SequenceStep = {
            id: `delay-${Date.now()}`,
            type: 'delay',
            delay: { days: 2, hours: 0, minutes: 0 }, // Initialize with minutes
            groupId
        };

        const followUpStep: SequenceStep = {
            id: `followup-${Date.now() + 1}`,
            type: 'followup',
            content: '',
            groupId
        };

        setSteps([...steps, delayStep, followUpStep]);
    };

    const deleteFollowUpGroup = (groupId: string) => {
        if (viewMode) return; // Prevent in view mode

        setSteps(steps.filter(step => step.groupId !== groupId));
    };

    const updateStepContent = (stepId: string, content: string) => {
        if (viewMode) return; // Prevent in view mode

        setSteps(steps.map(step =>
            step.id === stepId ? { ...step, content } : step
        ));
    };

    const updateDelay = (stepId: string, field: 'days' | 'hours' | 'minutes', value: number) => {
        if (viewMode) return; // Prevent in view mode

        setSteps(steps.map(step =>
            step.id === stepId && step.delay
                ? { ...step, delay: { ...step.delay, [field]: value } }
                : step
        ));
    };

    const insertVariable = (stepId: string, variableId: string) => {
        if (viewMode) return; // Prevent in view mode
        const step = steps.find(s => s.id === stepId);
        if (step && step.type === 'followup') {
            // Get textarea element
            const textarea = document.querySelector(`textarea[data-step-id="${stepId}"]`) as HTMLTextAreaElement;

            if (textarea) {
                // Get cursor position
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                // Insert variable at cursor position
                const content = step.content || '';
                const newContent = content.substring(0, start) + `{${variableId}}` + content.substring(end);

                // Update step content
                updateStepContent(stepId, newContent);

                // Set cursor position after inserted variable
                setTimeout(() => {
                    textarea.focus();
                    textarea.selectionStart = start + variableId.length + 2; // +2 for the curly braces
                    textarea.selectionEnd = start + variableId.length + 2;
                }, 0);
            } else {
                // Fallback to appending
                const newContent = (step.content || '') + `{${variableId}}`;
                updateStepContent(stepId, newContent);
            }
        } else if (step && step.type === 'connection') {
            // For connection steps
            const newMessage = (step.connectionMessage || '') + `{${variableId}}`;
            updateConnectionMessage(stepId, newMessage);
        }
    };

    // Add these state variables after your other state variables
    const [premiumMessage, setPremiumMessage] = useState<string>('');
    const [standardMessage, setStandardMessage] = useState<string>('');
    // Add this state variable to track which textarea is focused
    const [focusedMessageType, setFocusedMessageType] = useState<'premium' | 'standard'>('premium');

    const insertConnectionVariable = (variableId: string) => {
        if (viewMode) return; // Prevent in view mode

        if (focusedMessageType === 'premium') {
            setPremiumMessage((current) => current + `{${variableId}}`);
        } else {
            setStandardMessage((current) => current + `{${variableId}}`);
        }
    };

    const handleAddMessage = (step: SequenceStep) => {
        if (viewMode) return; // Prevent in view mode

        setCurrentConnectionStep(step);
        // Set both message types to the current connection message
        setPremiumMessage(step.connectionMessage || '');
        setStandardMessage(step.connectionMessage || '');
        setIsConnectionMessageOpen(true);
    };

    const handleSaveMessage = () => {
        if (viewMode) return; // Prevent in view mode

        if (currentConnectionStep) {
            // For now, we'll use premium message if available, otherwise standard message
            const messageToSave = premiumMessage || standardMessage;
            updateConnectionMessage(currentConnectionStep.id, messageToSave);
        }
        
        setIsConnectionMessageOpen(false);
        setCurrentConnectionStep(null);
    };

    const handleDismissMessage = () => {
        if (viewMode) return; // Prevent in view mode

        if (currentConnectionStep) {
            // Reset to original message
            const originalStep = steps.find(s => s.id === currentConnectionStep.id);
            if (originalStep) {
                setCurrentConnectionStep(originalStep);
            }
        }
        setIsConnectionMessageOpen(false);
        setCurrentConnectionStep(null);
    };

    const handlePreview = (stepId: string) => {
        const step = steps.find(s => s.id === stepId);
        if (!step || !step.content) return;

        // Replace variables with example values
        let previewText = step.content;
        variables.forEach(variable => {
            const pattern = new RegExp(`\\{${variable.id}\\}`, 'g');
            previewText = previewText.replace(pattern, variable.exampleValue);
        });

        setPreviewMessage(previewText);
        setPreviewStepId(stepId);
        setIsPreviewOpen(true);
    };

    // When in view mode, show a nicer preview dialog for any step content
    const handleViewContent = (content: string) => {
        if (!content) return;

        // Replace variables with example values
        let previewText = content;
        variables.forEach(variable => {
            const pattern = new RegExp(`\\{${variable.id}\\}`, 'g');
            previewText = previewText.replace(pattern, variable.exampleValue);
        });

        setPreviewMessage(previewText);
        setIsPreviewOpen(true);
    };

    // Enhanced renderConnectionStep with better view mode support
    const renderConnectionStep = (step: SequenceStep) => (
        <div className={`bg-gradient-to-r ${viewMode
            ? 'from-indigo-50/70 to-purple-50/70 border-indigo-100'
            : 'from-indigo-50 to-purple-50 border-indigo-200'} 
            rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border`}>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-base font-semibold text-gray-900">Send Connection Request</h3>
                            {viewMode && (
                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 flex items-center text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    View Only
                                </Badge>
                            )}
                        </div>
                        {step.connectionMessage ? (
                            <p className="text-xs text-gray-500">
                                {step.connectionMessage.length > 30
                                    ? `${step.connectionMessage.substring(0, 30)}...`
                                    : step.connectionMessage}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500">No message added</p>
                        )}
                    </div>
                </div>

                {!viewMode && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/60">
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border shadow-xl">
                            <DropdownMenuItem onClick={() => handleAddMessage(step)}>
                                Add message
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* View mode - show view button instead of dropdown */}
                {viewMode && step.connectionMessage && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            // Show connection message in preview dialog
                            let previewText = step.connectionMessage || '';
                            variables.forEach(variable => {
                                const pattern = new RegExp(`\\{${variable.id}\\}`, 'g');
                                previewText = previewText.replace(pattern, variable.exampleValue);
                            });
                            setPreviewMessage(previewText);
                            setIsPreviewOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-white/60"
                    >
                        <Eye className="w-4 h-4 text-gray-500" />
                    </Button>
                )}
            </div>

            {/* View mode - show message if available */}
            {viewMode && step.connectionMessage && (
                <div className="mt-3 p-3 bg-white/80 rounded-md text-sm text-gray-700 border border-gray-100">
                    {step.connectionMessage}
                </div>
            )}
        </div>
    );

    const renderRequestAcceptedStatus = () => (
        <div className="flex justify-center py-3">
            <div className="bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                Request Accepted
            </div>
        </div>
    );

    // Enhanced renderDelayStep with special handling for zero days
    const renderDelayStep = (step: SequenceStep, followUpNumber: number) => (
        <div className={`bg-slate-50 border ${viewMode ? 'border-slate-100' : 'border-slate-200'} rounded-lg px-4 py-3`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                        <span className="text-slate-600 font-medium">Wait</span>

                        {viewMode ? (
                            // View mode - properly handle zero days and include minutes
                            <span className="text-slate-600">
                                {(() => {
                                    const days = typeof step.delay?.days === 'number' ? step.delay.days : 0;
                                    const hours = step.delay?.hours || 0;
                                    const minutes = step.delay?.minutes || 0;

                                    if (days === 0 && hours === 0 && minutes === 0) {
                                        return '0 days';
                                    }

                                    let timeText = '';
                                    if (days > 0) {
                                        timeText += `${days} ${days === 1 ? 'day' : 'days'} `;
                                    }
                                    if (hours > 0) {
                                        timeText += `${timeText.length > 0 ? 'and ' : ''}${hours} ${hours === 1 ? 'hour' : 'hours'} `;
                                    }
                                    if (minutes > 0) {
                                        timeText += `${timeText.length > 0 ? 'and ' : ''}${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
                                    }
                                    return timeText.trim();
                                })()}
                                {followUpNumber === 1
                                    ? ' after connection is accepted'
                                    : ` after ${followUpNumber === 2 ? 'first' : followUpNumber === 3 ? 'second' : followUpNumber === 4 ? 'third' : (followUpNumber - 1) + 'th'} follow-up`}
                            </span>
                        ) : (
                            // Edit mode - add minutes input
                            <>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={step.delay?.days || 0}
                                        onChange={(e) => updateDelay(step.id, 'days', parseInt(e.target.value) || 0)}
                                        className="w-14 px-2 py-1.5 border border-slate-300 rounded-md text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        min="0"
                                        disabled={viewMode}
                                    />
                                    <span className="text-slate-600 text-xs">days</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={step.delay?.hours || 0}
                                        onChange={(e) => updateDelay(step.id, 'hours', parseInt(e.target.value) || 0)}
                                        className="w-14 px-2 py-1.5 border border-slate-300 rounded-md text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        min="0"
                                        max="23"
                                        disabled={viewMode}
                                    />
                                    <span className="text-slate-600 text-xs">hours</span>
                                </div>
                                {/* Add minutes input */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={step.delay?.minutes || 0}
                                        onChange={(e) => updateDelay(step.id, 'minutes', parseInt(e.target.value) || 0)}
                                        className="w-14 px-2 py-1.5 border border-slate-300 rounded-md text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        min="0"
                                        max="59"
                                        disabled={viewMode}
                                    />
                                    <span className="text-slate-600 text-xs">mins</span>
                                </div>
                                <span className="text-slate-500 text-xs">
                                    {followUpNumber === 1
                                        ? 'after connection is accepted'
                                        : `after ${followUpNumber === 2 ? 'first' : followUpNumber === 3 ? 'second' : followUpNumber === 4 ? 'third' : (followUpNumber - 1) + 'th'} follow-up`}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Enhanced renderFollowUpStep with better view mode styling
    const renderFollowUpStep = (step: SequenceStep, index: number) => {
        const followUpNumber = steps.filter((s, i) => s.type === 'followup' && i <= index).length;

        return (
            <div className={`bg-white border ${viewMode ? 'border-gray-100' : 'border-gray-200'} rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center">
                                <h3 className="text-base font-semibold text-gray-900">Follow Up {followUpNumber}</h3>
                                {viewMode && (
                                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 flex items-center text-xs">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Read Only
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Send personalized message</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(step.id)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0 rounded-lg"
                            title="Preview message"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>

                        {!viewMode && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFollowUpGroup(step.groupId!)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {viewMode ? (
                        // View mode - show content as read-only text
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                            {step.content || 'No message content'}
                        </div>
                    ) : (
                        // Edit mode - show textarea
                        <>
                            <Textarea
                                value={step.content || ''}
                                onChange={(e) => updateStepContent(step.id, e.target.value)}
                                data-step-id={step.id}
                                placeholder="Hi {first_name},&#10;Thanks for connecting!"
                                className="min-h-[100px] resize-none border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 rounded-lg text-sm leading-relaxed"
                                disabled={viewMode}
                            />

                            <div className="border-t border-gray-100 pt-3">
                                {variablesLoading ? (
                                    <div className="text-xs text-gray-500 py-2">Loading variables...</div>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {variables.map(variable => (
                                            <Button
                                                key={variable.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    insertVariable(step.id, variable.id);
                                                }}
                                                className="h-7 text-xs px-2 border-gray-200 hover:bg-indigo-50"
                                                disabled={viewMode}
                                            >
                                                {variable.name}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Enhanced renderFollowUpGroup with better view mode styling
    const renderFollowUpGroup = (delayStep: SequenceStep, followUpStep: SequenceStep, index: number) => {
        // Calculate which follow-up number this is (1-based)
        const followUpNumber = steps.filter((s, i) => s.type === 'followup' && i <= index).length;

        return (
            <div className={`${viewMode ? 'bg-gray-50/30' : 'bg-gray-50/50'} border ${viewMode ? 'border-gray-100' : 'border-gray-200'} rounded-lg p-3 shadow-sm space-y-2`}>
                {renderDelayStep(delayStep, followUpNumber)}
                <div className="flex justify-center">
                    <div className="w-px h-3 bg-gray-300"></div>
                </div>
                {renderFollowUpStep(followUpStep, index)}
            </div>
        );
    };

    const renderStepConnector = () => (
        <div className="flex justify-center py-0.5">
            <div className="w-px h-3 bg-gray-300"></div>
        </div>
    );

    const renderLeadListInfo = () => {
        if (!leadListName) return null;

        return (
            <div className="mb-6 bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Lead List: {leadListName}</h3>
                        <p className="text-xs text-gray-500">{totalLeads} leads available</p>
                    </div>
                    {variablesLoading ? (
                        <div className="text-xs px-3 py-1 bg-gray-100 rounded-md">Loading...</div>
                    ) : (
                        <div className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-md">
                            Variables Loaded
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Group steps for rendering
    const groupedSteps = [];
    let i = 0;
    while (i < steps.length) {
        const step = steps[i];
        if (step.type === 'connection') {
            groupedSteps.push({ type: 'connection', step, index: i });
            i++;
        } else if (step.type === 'delay' && i + 1 < steps.length && steps[i + 1].type === 'followup' && step.groupId === steps[i + 1].groupId) {
            groupedSteps.push({ type: 'followup-group', delayStep: step, followUpStep: steps[i + 1], index: i + 1 });
            i += 2;
        } else {
            i++;
        }
    }

    // Check if there are any follow-up groups
    const hasFollowUps = groupedSteps.some(group => group.type === 'followup-group');

    return (
        <>
            <div className={`max-w-2xl mx-auto space-y-1 p-4 ${viewMode ? 'bg-white/20 rounded-xl' : ''}`}>
                {/* View Mode Banner */}
                {viewMode && (
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <Eye className="w-4 h-4 mr-2 text-blue-600" />
                        <AlertDescription className="text-blue-800 flex items-center">
                            <span>You are viewing the campaign sequence in read-only mode</span>
                            <Badge className="ml-3 bg-blue-100 text-blue-700 border-blue-200">
                                <Lock className="w-3 h-3 mr-1" /> View Mode
                            </Badge>
                        </AlertDescription>
                    </Alert>
                )}

                {renderLeadListInfo()}

                {/* Add the "exclude connected" option below the lead info */}
                {hasFollowUps && (
                    <div className={`mb-6 ${viewMode ? 'bg-gray-50/50' : 'bg-white'} border ${viewMode ? 'border-gray-100' : 'border-gray-200'} rounded-lg p-4 shadow-sm`}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-medium text-gray-800">Follow-up Settings</h3>
                                <p className="text-xs text-gray-500">Configure how follow-up messages are handled</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="exclude-connected"
                                        checked={excludeConnected}
                                        onCheckedChange={!viewMode ? setExcludeConnected : undefined}
                                        disabled={viewMode}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                    <Label
                                        htmlFor="exclude-connected"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Don't send follow-ups to already connected
                                    </Label>
                                </div>

                                {excludeConnected && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {excludeConnected && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                <p className="text-xs text-blue-700 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Follow-up messages will only be sent to leads who haven't connected yet
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    {/* Connection Step */}
                    {groupedSteps.map((group, index) => (
                        <div key={index}>
                            {group.type === 'connection' && (
                                <>
                                    {renderConnectionStep(group.step)}
                                    {renderStepConnector()}
                                    {renderRequestAcceptedStatus()}
                                    {(hasFollowUps || index < groupedSteps.length - 1) && renderStepConnector()}
                                </>
                            )}
                            {group.type === 'followup-group' && (
                                <>
                                    {renderFollowUpGroup(group.delayStep, group.followUpStep, group.index)}
                                    {index < groupedSteps.length - 1 && renderStepConnector()}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Only show in non-view mode */}
                {!viewMode && (
                    <div className="pt-6 mt-6">
                        <div className="text-center space-y-3">
                            <Button
                                onClick={addFollowUp}
                                className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                                size="sm"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Add Follow-up Message</p>
                                <p className="text-xs text-gray-500">Create additional touchpoints to increase engagement</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* View mode summary when there are no follow-ups */}
                {viewMode && !hasFollowUps && groupedSteps.length > 0 && (
                    <div className="pt-6 mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            This campaign only uses the initial connection request with no follow-up messages.
                        </p>
                    </div>
                )}

                {/* View mode empty state */}
                {viewMode && groupedSteps.length === 0 && (
                    <div className="pt-6 mt-6 text-center bg-gray-50 p-8 rounded-lg border border-gray-200">
                        <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">No sequence steps found</p>
                        <p className="text-sm text-gray-500 mt-1">This campaign doesn't have any message sequence configured.</p>
                    </div>
                )}
            </div>

            {/* Connection Message Sheet */}
            <Sheet open={isConnectionMessageOpen} onOpenChange={(open) => !viewMode && setIsConnectionMessageOpen(open)}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>
                            {viewMode ? "Connection Request Message" : "Edit Connection Request Message"}
                        </SheetTitle>
                        <SheetDescription>
                            {viewMode
                                ? "View your connection request message."
                                : "Customize your connection request message with personalized variables."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6 flex-1">
                        {viewMode && (
                            <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-700 flex items-center mb-4">
                                <Eye className="w-4 h-4 mr-2" />
                                View-only mode. Message cannot be edited.
                            </div>
                        )}

                        {/* Premium Accounts Section */}
                        {groupedAccounts.premium.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Premium Accounts</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {groupedAccounts.premium.map(account => (
                                <div key={account.id} className="flex items-center bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
                                  <Avatar className="h-6 w-6 mr-1.5">
                                    {account.profileImageUrl ? (
                                      <AvatarImage src={account.profileImageUrl} alt={account.firstName} />
                                    ) : (
                                      <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                                        {account.firstName?.[0]}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span className="text-xs font-medium text-amber-900">{account.firstName}</span>
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1.5"></div>
                                </div>
                              ))}
                            </div>
                                                    
                            {/* Premium Message Input - Keep the same */}
                            <div className="mb-6">
                              <label className="text-sm font-medium text-gray-700 mb-2 block flex justify-between">
                                <span>Premium Message</span>
                                <span className={`text-xs ${getCharacterLimitColor(premiumMessage.length, 300)}`}>
                                  {premiumMessage.length}/300
                                  <span className="ml-1 bg-amber-100 text-amber-700 px-1 rounded text-[10px] font-medium">
                                    PREMIUM
                                  </span>
                                </span>
                              </label>
                              
                              {viewMode ? (
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[120px]">
                                    {premiumMessage || 'No message content'}
                                </div>
                              ) : (
                                <div className="relative">
                                  <Textarea
                                      value={premiumMessage}
                                      onChange={(e) => {
                                          if (!viewMode) {
                                              // Limit premium input to 300 characters
                                              const newText = e.target.value.slice(0, 300);
                                              setPremiumMessage(newText);
                                          }
                                      }}
                                      onFocus={() => setFocusedMessageType('premium')}
                                      placeholder="Hi {first_name}, I'd like to connect with you... (Premium: 300 characters allowed)"
                                      className={`min-h-[120px] resize-none bg-amber-50 border-amber-200 focus:border-amber-300 focus:ring-amber-200 ${
                                          premiumMessage.length >= 300
                                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                              : focusedMessageType === 'premium' ? "ring-2 ring-amber-300" : ""
                                      }`}
                                      disabled={viewMode}
                                  />
                                  
                                  {premiumMessage.length >= 300 && (
                                      <div className="mt-1 text-xs text-red-500 flex items-center">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          You've reached the premium character limit (300)
                                      </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Standard Accounts Section */}
                        {groupedAccounts.standard.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Standard Accounts</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {groupedAccounts.standard.map(account => (
                                <div key={account.id} className="flex items-center bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
                                  <Avatar className="h-6 w-6 mr-1.5">
                                    {account.profileImageUrl ? (
                                      <AvatarImage src={account.profileImageUrl} alt={account.firstName} />
                                    ) : (
                                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                                        {account.firstName?.[0]}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span className="text-xs font-medium text-blue-900">{account.firstName}</span>
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1.5"></div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Standard Message Input */}
                            <div className="mb-6">
                              <label className="text-sm font-medium text-gray-700 mb-2 block flex justify-between">
                                <span>Standard Message</span>
                                <span className={`text-xs ${getCharacterLimitColor(standardMessage.length, 200)}`}>
                                  {standardMessage.length}/200
                                  <span className="ml-1 bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-medium">
                                    STANDARD
                                  </span>
                                </span>
                              </label>
                              
                              {viewMode ? (
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[120px]">
                                    {standardMessage || 'No message content'}
                                </div>
                              ) : (
                                <div className="relative">
                                  <Textarea
                                      value={standardMessage}
                                      onChange={(e) => {
                                          if (!viewMode) {
                                              // Limit standard input to 200 characters
                                              const newText = e.target.value.slice(0, 200);
                                              setStandardMessage(newText);
                                          }
                                      }}
                                      onFocus={() => setFocusedMessageType('standard')}
                                      placeholder="Hi {first_name}, I'd like to connect with you... (Standard: 200 characters allowed)"
                                      className={`min-h-[120px] resize-none bg-blue-50 border-blue-200 focus:border-blue-300 focus:ring-blue-200 ${
                                          standardMessage.length >= 200
                                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                              : focusedMessageType === 'standard' ? "ring-2 ring-blue-300" : ""
                                      }`}
                                      disabled={viewMode}
                                  />
                                  
                                  {standardMessage.length >= 200 && (
                                      <div className="mt-1 text-xs text-red-500 flex items-center">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          You've reached the standard character limit (200). Upgrade to premium for longer messages.
                                      </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Variables Section */}
                        {!viewMode && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-gray-700">Insert Variables</p>
                                    <Badge 
                                        className={focusedMessageType === 'premium' 
                                            ? "bg-amber-100 text-amber-700 border-amber-200"
                                            : "bg-blue-100 text-blue-700 border-blue-200"
                                        }
                                    >
                                        Adding to {focusedMessageType === 'premium' ? 'Premium' : 'Standard'} message
                                    </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {variables.map(variable => (
                                        <Button
                                            key={variable.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => insertConnectionVariable(variable.id)}
                                            className={`justify-start ${focusedMessageType === 'premium' 
                                                ? "bg-amber-50 border-amber-200 hover:bg-amber-100" 
                                                : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                            }`}
                                            disabled={viewMode}
                                        >
                                            <User className={`w-4 h-4 mr-2 ${
                                                focusedMessageType === 'premium' ? "text-amber-700" : "text-blue-700"
                                            }`} />
                                            {variable.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t mt-4">
                        {!viewMode && (
                            <Button
                                onClick={handleSaveMessage}
                                className="flex-1"
                                disabled={viewMode}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleDismissMessage}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 mr-2" />
                            {viewMode ? 'Close' : 'Dismiss'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Message Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Message Preview</DialogTitle>
                        <DialogDescription>
                            Here's how your message will appear with example data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-gray-50 p-4 rounded-md mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">You</p>
                                    <p className="text-xs text-gray-500">Example preview with test data</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm whitespace-pre-wrap text-sm">
                                {previewMessage}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        <p>This is a preview using example data. Actual messages will use your leads' information.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Sequence;