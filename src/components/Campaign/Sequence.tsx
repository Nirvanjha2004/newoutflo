import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageCircle, Plus, Trash2, UserPlus, MoreHorizontal, User, X, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
}

const Sequence: React.FC<SequenceProps> = ({
    workflowData,
    updateWorkflow,
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
        // Skip if we're currently in an update cycle from props
        if (isUpdatingRef.current) {
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
    }, [steps, workflowData]);

    // Add this effect to update the campaign store when steps change
    useEffect(() => {
        // Skip if we're currently in an update cycle from props
        if (isUpdatingRef.current) {
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

    }, [steps, setConfigs]);

    const addFollowUp = () => {
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
        setSteps(steps.filter(step => step.groupId !== groupId));
    };

    const updateStepContent = (stepId: string, content: string) => {
        setSteps(steps.map(step =>
            step.id === stepId ? { ...step, content } : step
        ));
    };

    const updateDelay = (stepId: string, field: 'days' | 'hours', value: number) => {
        setSteps(steps.map(step =>
            step.id === stepId && step.delay
                ? { ...step, delay: { ...step.delay, [field]: value } }
                : step
        ));
    };

    const insertVariable = (stepId: string, variableId: string) => {
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
        if (currentConnectionStep) {
            const newMessage = (currentConnectionStep.connectionMessage || '') + `{${variableId}}`;
            updateConnectionMessage(currentConnectionStep.id, newMessage);
            setCurrentConnectionStep({ ...currentConnectionStep, connectionMessage: newMessage });
        }
    };

    const handleAddMessage = (step: SequenceStep) => {
        setCurrentConnectionStep(step);
        setIsConnectionMessageOpen(true);
    };

    const handleSaveMessage = () => {
        setIsConnectionMessageOpen(false);
        setCurrentConnectionStep(null);
    };

    const handleDismissMessage = () => {
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

    const renderConnectionStep = (step: SequenceStep) => (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Send Connection Request</h3>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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

    const renderDelayStep = (step: SequenceStep) => (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                        <span className="text-slate-600 font-medium">Wait</span>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                value={step.delay?.days || 0}
                                onChange={(e) => updateDelay(step.id, 'days', parseInt(e.target.value) || 0)}
                                className="w-14 px-2 py-1.5 border border-slate-300 rounded-md text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                min="0"
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
                            />
                            <span className="text-slate-600 text-xs">hours</span>
                        </div>
                        <span className="text-slate-500 text-xs">after connection is accepted</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFollowUpStep = (step: SequenceStep, index: number) => {
        const followUpNumber = steps.filter((s, i) => s.type === 'followup' && i <= index).length;

        console.log(variables)
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Follow Up {followUpNumber}</h3>
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
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFollowUpGroup(step.groupId!)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <Textarea
                        value={step.content || ''}
                        onChange={(e) => updateStepContent(step.id, e.target.value)}
                        data-step-id={step.id} // Add this data attribute
                        placeholder="Hi {first_name},&#10;Thanks for connecting!"
                        className="min-h-[100px] resize-none border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 rounded-lg text-sm leading-relaxed"
                    />

                    <div className="border-t border-gray-100 pt-3">
                        {/* <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Insert Variables</p> */}
                        
                        {variablesLoading ? (
                            <div className="text-xs text-gray-500 py-2">Loading variables...</div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {/* All variables horizontally in one group */}
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
                                    >
                                        {variable.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderFollowUpGroup = (delayStep: SequenceStep, followUpStep: SequenceStep, index: number) => (
        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3 shadow-sm space-y-2">
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
            <div className="max-w-2xl mx-auto space-y-1 p-4">
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
            </div>

            {/* Connection Message Sheet */}
            <Sheet open={isConnectionMessageOpen} onOpenChange={setIsConnectionMessageOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Connection Request Message</SheetTitle>
                        <SheetDescription>
                            Customize your connection request message with personalized variables.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4 flex-1">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Message
                            </label>
                            <Textarea
                                value={currentConnectionStep?.connectionMessage || ''}
                                onChange={(e) => {
                                    if (currentConnectionStep) {
                                        updateConnectionMessage(currentConnectionStep.id, e.target.value);
                                        setCurrentConnectionStep({ ...currentConnectionStep, connectionMessage: e.target.value });
                                    }
                                }}
                                placeholder="Hi {first_name}, I'd like to connect with you..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>

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
                                    >
                                        <User className="w-4 h-4 mr-2" />
                                        {variable.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t">
                        <Button
                            onClick={handleSaveMessage}
                            className="flex-1"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDismissMessage}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Dismiss
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


