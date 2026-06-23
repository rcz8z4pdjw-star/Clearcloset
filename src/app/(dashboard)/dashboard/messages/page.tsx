'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Image,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Circle,
  ArrowLeft,
  Star,
  Pin,
  Trash2,
  Archive,
  Bell,
  BellOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock conversations data
const conversations = [
  {
    id: 'c1',
    name: 'Alex Johnson',
    avatar: null,
    lastMessage: 'Great job on completing the quiz! 🎉',
    lastMessageTime: '2m ago',
    unread: 2,
    online: true,
    isPinned: true,
    relationship: 'friend',
  },
  {
    id: 'c2',
    name: 'Sarah Williams (Mentor)',
    avatar: null,
    lastMessage: 'Let me know if you need help with the investing module.',
    lastMessageTime: '1h ago',
    unread: 0,
    online: true,
    isPinned: true,
    relationship: 'mentor',
  },
  {
    id: 'c3',
    name: 'Jamie Smith',
    avatar: null,
    lastMessage: 'Want to do the family challenge together?',
    lastMessageTime: '3h ago',
    unread: 1,
    online: false,
    isPinned: false,
    relationship: 'sibling',
  },
  {
    id: 'c4',
    name: 'Morgan Lee',
    avatar: null,
    lastMessage: 'Thanks for the tip on the savings calculator!',
    lastMessageTime: 'Yesterday',
    unread: 0,
    online: false,
    isPinned: false,
    relationship: 'friend',
  },
  {
    id: 'c5',
    name: 'Teen Investing Club',
    avatar: null,
    lastMessage: 'Taylor: Has anyone tried the stock simulator?',
    lastMessageTime: 'Yesterday',
    unread: 5,
    online: false,
    isPinned: false,
    relationship: 'group',
    memberCount: 24,
  },
];

// Mock messages for selected conversation
const mockMessages: Record<string, any[]> = {
  c1: [
    {
      id: 'm1',
      senderId: 'other',
      text: 'Hey! Did you see the new challenges?',
      time: '10:30 AM',
      status: 'read',
    },
    {
      id: 'm2',
      senderId: 'me',
      text: 'Yes! I already completed two daily challenges 💪',
      time: '10:32 AM',
      status: 'read',
    },
    {
      id: 'm3',
      senderId: 'other',
      text: 'Nice! Want to do the family challenge together?',
      time: '10:33 AM',
      status: 'read',
    },
    {
      id: 'm4',
      senderId: 'me',
      text: 'Definitely! Let me check which ones are available',
      time: '10:35 AM',
      status: 'read',
    },
    {
      id: 'm5',
      senderId: 'other',
      text: 'Great job on completing the quiz! 🎉',
      time: '10:45 AM',
      status: 'delivered',
    },
  ],
  c2: [
    {
      id: 'm1',
      senderId: 'other',
      text: 'Hi! How are you finding the investing module so far?',
      time: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm2',
      senderId: 'me',
      text: 'It\'s really interesting! I have some questions about diversification.',
      time: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm3',
      senderId: 'other',
      text: 'That\'s a great topic! Diversification is key to reducing risk. Would you like to schedule a session to discuss it in detail?',
      time: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm4',
      senderId: 'me',
      text: 'That would be amazing! When are you available?',
      time: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm5',
      senderId: 'other',
      text: 'Let me know if you need help with the investing module.',
      time: '1h ago',
      status: 'delivered',
    },
  ],
};

const relationshipBadges: Record<string, { label: string; color: string }> = {
  friend: { label: 'Friend', color: 'bg-blue-100 text-blue-700' },
  sibling: { label: 'Sibling', color: 'bg-green-100 text-green-700' },
  mentor: { label: 'Mentor', color: 'bg-purple-100 text-purple-700' },
  group: { label: 'Group', color: 'bg-orange-100 text-orange-700' },
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const unpinnedConversations = filteredConversations.filter(c => !c.isPinned);

  const selectedConvo = conversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? mockMessages[selectedConversation] || [] : [];

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In a real app, this would send the message to the API
    setMessageInput('');
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setShowMobileChat(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversation List */}
      <div className={`w-full md:w-96 border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
            <MessageCircle className="h-6 w-6 text-indigo-500" />
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {pinnedConversations.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                <Pin className="h-3 w-3" />
                PINNED
              </p>
              {pinnedConversations.map((convo) => (
                <ConversationItem
                  key={convo.id}
                  conversation={convo}
                  isSelected={selectedConversation === convo.id}
                  onClick={() => handleSelectConversation(convo.id)}
                />
              ))}
            </div>
          )}

          <div className="p-2">
            {pinnedConversations.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                ALL MESSAGES
              </p>
            )}
            {unpinnedConversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                isSelected={selectedConversation === convo.id}
                onClick={() => handleSelectConversation(convo.id)}
              />
            ))}
          </div>

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!showMobileChat && !selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConvo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConvo.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedConvo.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedConvo.online ? 'Online' : 'Offline'}
                    {selectedConvo.memberCount && ` • ${selectedConvo.memberCount} members`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Star className="h-4 w-4 mr-2" />
                      {selectedConvo.isPinned ? 'Unpin' : 'Pin'} conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BellOff className="h-4 w-4 mr-2" />
                      Mute notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.senderId === 'me'
                          ? 'bg-indigo-500 text-white rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.senderId === 'me' ? 'text-indigo-200' : 'text-muted-foreground'
                      }`}>
                        <span className="text-xs">{message.time}</span>
                        {message.senderId === 'me' && (
                          message.status === 'read' ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Image className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: typeof conversations[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  const badge = relationshipBadges[conversation.relationship];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-50' : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar>
          <AvatarFallback>
            {conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        {conversation.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate">{conversation.name}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {conversation.lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessage}
          </p>
          {conversation.unread > 0 && (
            <Badge className="bg-indigo-500 text-white h-5 min-w-[20px] flex items-center justify-center">
              {conversation.unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
