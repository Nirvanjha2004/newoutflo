import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Plus, MoreHorizontal, Star, Settings, Paperclip, Mic } from "lucide-react";
import { EmojiPicker } from "@/components/Inbox/EmojiPicker";
import { Conversation, Message } from "@/types/inbox";
import { useMessagesQuery } from "@/hooks/useInboxQueries";
import { usePostMessage } from "@/hooks/useInboxMutations";
import { useToast } from "@/hooks/use-toast";

interface ConversationViewProps {
  conversation: Conversation | null;
  onClose: () => void;
  onProfilePreview: (conversation: Conversation) => void;
}

export const ConversationView = ({ conversation, onClose, onProfilePreview }: ConversationViewProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationDetail, isLoading: loading, error } = useMessagesQuery(conversation?.id);
  const postMessageMutation = usePostMessage();


  console.log("The conversation detail:", conversationDetail);
  // Extract messages array from API response (handles different response formats)
  const messages = useMemo(() => {
    if (!conversationDetail) return [];

    // Handle case where messages is a property of conversationDetail
    if (conversationDetail.messages && Array.isArray(conversationDetail.messages))
      return conversationDetail.messages;

    // Handle case where conversationDetail is directly the messages array
    if (Array.isArray(conversationDetail))
      return conversationDetail;

    console.error("Unknown message data format:", conversationDetail);
    return [];
  }, [conversationDetail]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversation) return;

    try {
      await postMessageMutation.mutateAsync({
        conversationId: conversation.id,
        text: message
      });
      setMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  // Determine if a message is sent by the current user
  const isOwnMessage = (msg: Message) => {
    if (!conversation || !msg.senderUrn) return false;

    // Here's the issue - we need to invert this logic
    // In your current setup, accounts[0] is typically YOUR account, not the contact
    // So messages FROM that account should appear on the right (as your own messages)
    const primaryAccount = conversation.accounts[0];

    // With the corrected logic: message IS from you if it matches the primary account
    return msg.senderUrn === primaryAccount.urn;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return "";

    // Convert string timestamp to number if needed
    const timeValue = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    return new Date(timeValue).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for message groups
  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return "Today";

    const timeValue = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    return new Date(timeValue).toLocaleDateString();
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="relative mb-8">
          <div className="w-40 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center relative border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl transform rotate-12 shadow-lg"></div>
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-80 blur-sm"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full opacity-60"></div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 border-2 border-blue-300 border-dashed rounded-full animate-pulse"></div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">Select a conversation</h2>
        <p className="text-gray-500 text-lg">Choose a conversation from the sidebar to start chatting</p>
        <div className="mt-6 flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>Powered by Outflo AI</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-red-500">Error loading messages</div>
      </div>
    );
  }

  // Get contact information from the conversation
  const primaryAccount = conversation.accounts.find(acc => acc.firstName || acc.lastName) || conversation.accounts[0];
  const fullName = `${primaryAccount.firstName || ''} ${primaryAccount.lastName || ''}`.trim();
  const initials = `${(primaryAccount.firstName || ' ')[0] || ''}${(primaryAccount.lastName || ' ')[0] || ''}`.toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Profile Header */}
      <div className="profile-header bg-white px-6 py-5 border-b-2 border-gray-200 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <Avatar className="w-14 h-14 ring-4 ring-indigo-50 border border-gray-200">
              {primaryAccount.profileImageUrl ? (
                <AvatarImage
                  src={primaryAccount.profileImageUrl}
                  alt={fullName}
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <AvatarFallback className="bg-gray-200 text-gray-600 font-medium">
                  {initials || 'CN'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="font-bold text-gray-900 text-lg">{fullName || 'Contact'}</h3>
                <Star size={16} className="text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors ml-2" />
              </div>
              <p className="text-sm text-gray-600">
                {primaryAccount.location || 'Location'} | {primaryAccount.title || 'Title'}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  Profile Connections
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-xs flex items-center text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Active now
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 
            Profile Preview button commented out
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onProfilePreview(conversation)}
              className="bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 px-4 py-2"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile Preview
              </span>
            </Button>
            */}
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-gray-100" onClick={onClose}>
              <MoreHorizontal size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation View - Enhanced message area */}
      <div className="conversation-view flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {/* Date header with better styling */}
        <div className="text-center my-4">
          <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-medium shadow-sm">
            {conversationDetail ? formatDate(conversationDetail.createdAt || conversationDetail.createdAtEpoch) : 'Today'}
          </span>
        </div>

        {/* Messages with enhanced bubbles */}
        {messages.length > 0 ? (
          messages.map((msg: Message, index: number) => {
            const own = isOwnMessage(msg);
            const showDateSeparator = index > 0 &&
              formatDate(messages[index].sentAt) !== formatDate(messages[index - 1].sentAt);

            return (
              <div key={msg.id || msg.urn || index} className="message-group">
                {showDateSeparator && (
                  <div className="text-center my-6">
                    <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-medium">
                      {formatDate(msg.sentAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end ${own ? 'justify-end' : 'justify-start'} mb-5`}>
                  {!own && (
                    <Avatar className="w-8 h-8 mr-2 mb-1 flex-shrink-0 ring-2 ring-gray-100">
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`message max-w-xs lg:max-w-md ${own ? 'ml-12' : 'mr-12'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${own
                      ? 'bg-purple-600 text-white rounded-br-none shadow-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                      }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    </div>
                    <div className={`text-[11px] mt-1 ${own ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                      {formatTimestamp(msg.sentAt)}
                      {own && <span className="ml-1 font-medium">You</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex justify-center py-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
              </div>
              <p className="text-gray-500">No messages in this conversation yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to say hello!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area - Elevated and separated */}
      <div className="message-input bg-gradient-to-r from-white to-purple-50 p-5 border-t border-gray-200 rounded-t-xl shadow-lg mx-2 mb-2">
        {/* Message composition area with improved styling */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="pr-24 border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-0 bg-white rounded-lg py-3 pl-4 shadow-sm "
              style={{ boxShadow: 'none', borderColor: '#e5e7eb' }} // optional inline override

            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors">
                <Paperclip size={16} />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || postMessageMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg shadow transition-all duration-200 flex items-center hover:translate-y-[-2px]"
          >
            {postMessageMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center">
                Send
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
              </span>
            )}
          </Button>
        </div>

        {/* Enhanced message tools bar */}
        <div className="flex flex-wrap items-center justify-between mt-4 px-1">
          {/* <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <Button variant="ghost" className="bg-white text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-md text-xs flex items-center h-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><rect width="18" height="14" x="3" y="4" rx="2"></rect><line x1="12" x2="12" y1="4" y2="18"></line></svg>
              Templates
            </Button>
            <Button variant="ghost" className="bg-white text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-md text-xs flex items-center h-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              Files
            </Button>
            <Button variant="ghost" className="bg-white text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-md text-xs flex items-center h-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
              More
            </Button>
          </div> */}

          {/* <div className="flex items-center text-xs text-gray-500 border-l pl-3 border-gray-200">
            <span className="mr-2 font-medium">From:</span>
            <div className="flex items-center bg-white border border-purple-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
              <Avatar className="w-5 h-5 mr-1.5">
                <AvatarFallback className="bg-purple-600 text-white text-[10px]">H</AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-700">Hrishikesh Vibhandik</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 text-gray-400"><path d="m6 9 6 6 6-6"></path></svg>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};
