import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageCircle, Plus, Trash2, UserPlus, MoreHorizontal, User, X, Save, Eye, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
    delay?: { days: number; hours: number };
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

    console.log('The leadlist ID is:', leadListId);

    // Add state for variables and preview
    const [variables, setVariables] = useState<Variable[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('');
    const [previewStepId, setPreviewStepId] = useState<string | null>(null);
    const [leadListName, setLeadListName] = useState<string>('');
    const [totalLeads, setTotalLeads] = useState<number>(0);

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
            console.log('Fetched campaign variables:', variablesData);
            // Update variables state
            setVariables(variablesData || []);
            // Store additional information
        }
    }, [variablesData]);

    // Use campaign store - only setConfigs is relevant here
    const { setConfigs } = useCampaignStore();

    const isUpdatingRef = useRef(false);

    // Initialize steps from workflowData if available, otherwise use default steps

    console.log('Workflow data:', workflowData);
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

                    // Add delay step
                    const delayStep = {
                        id: `api-delay-${index}`,
                        type: 'delay',
                        delay: {
                            days: Math.floor((step.data.delay || 2 * 24 * 60 * 60) / (24 * 60 * 60)),
                            hours: Math.floor(((step.data.delay || 2 * 24 * 60 * 60) % (24 * 60 * 60)) / (60 * 60))
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
                    delay: { days: 1, hours: 0 },
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

                    // Add delay step
                    convertedSteps.push({
                        id: `api-delay-${index}`,
                        type: 'delay',
                        delay: {
                            days: Math.floor((step.data.delay || 2 * 24 * 60 * 60) / (24 * 60 * 60)),
                            hours: Math.floor(((step.data.delay || 2 * 24 * 60 * 60) % (24 * 60 * 60)) / (60 * 60))
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
                // Calculate delay in seconds
                const delayInSeconds =
                    (group.delay.delay?.days || 0) * 24 * 60 * 60 +
                    (group.delay.delay?.hours || 0) * 60 * 60;

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
        const newWorkflow = { steps: apiSteps };

        // Only update if there's an actual change
        if (!isEqual(newWorkflow, workflowData)) {
            updateWorkflow(newWorkflow);
        }
    }, [steps, workflowData, viewMode]);

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
                // Calculate delay in seconds
                const delayInSeconds =
                    (group.delay.delay?.days || 0) * 24 * 60 * 60 +
                    (group.delay.delay?.hours || 0) * 60 * 60;

                configs.push({
                    id: followUpIndex,
                    parentID: followUpIndex,
                    action: "sendFollowUp",
                    data: {
                        delay: delayInSeconds,
                        text: group.followUp.content || ""
                    }
                });

                followUpIndex++;
            }
        });

        // Update the campaign store with configs
        setConfigs(configs);
        console.log('Updated campaign store with configs:', configs);

    }, [steps, setConfigs, viewMode]);

    const addFollowUp = () => {
        if (viewMode) return; // Prevent in view mode
        
        const groupId = `group-${Date.now()}`;

        const delayStep: SequenceStep = {
            id: `delay-${Date.now()}`,
            type: 'delay',
            delay: { days: 2, hours: 0 },
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

    const updateDelay = (stepId: string, field: 'days' | 'hours', value: number) => {
        if (viewMode) return; // Prevent in view mode
        
        setSteps(steps.map(step =>
            step.id === stepId && step.delay
                ? { ...step, delay: { ...step.delay, [field]: value } }
                : step
        ));
    };

    const insertVariable = (stepId: string, variableId: string) => {
        if (viewMode) return; // Prevent in view mode
        
        console.log(`Finding step ${stepId} to insert variable ${variableId}`);
        const step = steps.find(s => s.id === stepId);
        console.log('Found step:', step);
        
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

    const insertConnectionVariable = (variableId: string) => {
        if (viewMode) return; // Prevent in view mode
        
        if (currentConnectionStep) {
            const newMessage = (currentConnectionStep.connectionMessage || '') + `{${variableId}}`;
            updateConnectionMessage(currentConnectionStep.id, newMessage);
            setCurrentConnectionStep({ ...currentConnectionStep, connectionMessage: newMessage });
        }
    };

    const handleAddMessage = (step: SequenceStep) => {
        if (viewMode) return; // Prevent in view mode
        
        setCurrentConnectionStep(step);
        setIsConnectionMessageOpen(true);
    };

    const handleSaveMessage = () => {
        if (viewMode) return; // Prevent in view mode
        
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

    // Enhanced renderDelayStep with better view mode styling
    const renderDelayStep = (step: SequenceStep) => (
        <div className={`bg-slate-50 border ${viewMode ? 'border-slate-100' : 'border-slate-200'} rounded-lg px-4 py-3`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                        <span className="text-slate-600 font-medium">Wait</span>
                        
                        {viewMode ? (
                            // View mode - show static values
                            <span className="text-slate-600">
                                {step.delay?.days || 0} days {step.delay?.hours ? `and ${step.delay.hours} hours` : ''} after connection is accepted
                            </span>
                        ) : (
                            // Edit mode - show inputs
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
                                <span className="text-slate-500 text-xs">after connection is accepted</span>
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
                                                    console.log(`Inserting variable: ${variable.id} into step: ${step.id}`);
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
    const renderFollowUpGroup = (delayStep: SequenceStep, followUpStep: SequenceStep, index: number) => (
        <div className={`${viewMode ? 'bg-gray-50/30' : 'bg-gray-50/50'} border ${viewMode ? 'border-gray-100' : 'border-gray-200'} rounded-lg p-3 shadow-sm space-y-2`}>
            {renderDelayStep(delayStep)}
            <div className="flex justify-center">
                <div className="w-px h-3 bg-gray-300"></div>
            </div>
            {renderFollowUpStep(followUpStep, index)}
        </div>
    );

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

                    <div className="mt-6 space-y-4 flex-1">
                        {viewMode && (
                            <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-700 flex items-center mb-4">
                                <Eye className="w-4 h-4 mr-2" />
                                View-only mode. Message cannot be edited.
                            </div>
                        )}
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Message
                            </label>
                            {viewMode ? (
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[120px]">
                                    {currentConnectionStep?.connectionMessage || 'No message content'}
                                </div>
                            ) : (
                                <Textarea
                                    value={currentConnectionStep?.connectionMessage || ''}
                                    onChange={(e) => {
                                        if (currentConnectionStep && !viewMode) {
                                            updateConnectionMessage(currentConnectionStep.id, e.target.value);
                                            setCurrentConnectionStep({ ...currentConnectionStep, connectionMessage: e.target.value });
                                        }
                                    }}
                                    placeholder="Hi {first_name}, I'd like to connect with you..."
                                    className="min-h-[120px] resize-none"
                                    disabled={viewMode}
                                />
                            )}
                        </div>

                        {!viewMode && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Insert Variables</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {variables.map(variable => (
                                        <Button
                                            key={variable.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => insertConnectionVariable(variable.id)}
                                            className="justify-start"
                                            disabled={viewMode}
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            {variable.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t">
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