import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, User, ArrowLeft, UserX, Circle, Heart } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { auth, db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isBlocked?: boolean;
  lastMessageTime?: string;
  lastMessageContent?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    name: string;
    avatar: string;
  };
}

interface MessageGroup {
  date: string;
  messages: Message[];
}

export function Messages() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchFriends = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) return;

      setCurrentUser({
        id: user.uid,
        name: user.displayName || 'User',
        avatar: user.photoURL || ''
      });

      // For now, set empty friends since we don't have the friends/messages collections set up yet
      setFriends([]);
    } catch (error) {
      console.error('Error fetching friends for messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (friendId: string) => {
    try {
      // For now, set empty messages since we don't have the messages collection set up yet
      setMessages([]);
      setMessageGroups([]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !currentUser || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // For now, just show a toast since we don't have messages collection set up yet
      toast({
        title: 'Messages feature coming soon!',
        description: 'This feature will be available in the next update.',
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto h-[calc(100vh-60px)] bg-background rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-full">
            <div className="w-full md:w-80 border-r flex flex-col">
              <div className="p-3 border-b bg-muted/30 flex-shrink-0">
                <h2 className="font-pixelated text-sm font-medium">Messages</h2>
              </div>
              <div className="space-y-2 p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-muted rounded mb-1" />
                      <div className="h-2 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-60px)] bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-full">
          {/* Friends List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${selectedFriend ? 'hidden md:flex' : ''}`}>
            {/* Friends List Header */}
            <div className="p-3 border-b bg-muted/30 flex-shrink-0">
              <h2 className="font-pixelated text-sm font-medium">Messages</h2>
            </div>

            {/* Friends List - Scrollable with smooth scrolling */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full scroll-smooth">
                {friends.length > 0 ? (
                  <div className="p-2">
                    {friends.map(friend => (
                      <div
                        key={friend.id}
                        onClick={() => {
                          setSelectedFriend(friend);
                          fetchMessages(friend.id);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 relative ${
                          selectedFriend?.id === friend.id 
                            ? 'bg-accent shadow-md' 
                            : ''
                        } ${friend.isBlocked ? 'opacity-50' : ''} ${
                          friend.unreadCount && friend.unreadCount > 0 ? 'bg-social-green/5 border-l-4 border-social-green' : ''
                        }`}
                      >
                        <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                          {friend.avatar ? (
                            <AvatarImage src={friend.avatar} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground font-pixelated text-xs">
                              {friend.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium truncate text-sm font-pixelated ${
                              friend.unreadCount && friend.unreadCount > 0 ? 'text-foreground' : 'text-foreground'
                            }`}>
                              {friend.name}
                            </p>
                            {friend.lastMessageTime && (
                              <span className="text-xs text-muted-foreground font-pixelated">
                                {format(new Date(friend.lastMessageTime), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate font-pixelated ${
                              friend.unreadCount && friend.unreadCount > 0 
                                ? 'text-foreground font-medium' 
                                : 'text-muted-foreground'
                            }`}>
                              {friend.isBlocked ? (
                                <span className="text-destructive">• No longer friends</span>
                              ) : friend.lastMessageContent ? (
                                friend.lastMessageContent.substring(0, 30) + (friend.lastMessageContent.length > 30 ? '...' : '')
                              ) : (
                                `Start chatting with @${friend.username}`
                              )}
                            </p>
                            
                            {/* Show unread count badge or grey circle */}
                            <div className="ml-2 flex-shrink-0">
                              {friend.unreadCount && friend.unreadCount > 0 ? (
                                <Badge 
                                  variant="default" 
                                  className="h-5 w-5 p-0 text-xs flex items-center justify-center bg-social-green text-white animate-pulse"
                                >
                                  {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                                </Badge>
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300 opacity-60"></div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {friend.isBlocked && (
                          <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4 font-pixelated text-sm">No friends yet</p>
                    <Button variant="outline" asChild className="font-pixelated text-xs">
                      <a href="/friends">Find Friends</a>
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col h-full ${!selectedFriend ? 'hidden md:flex' : ''}`}>
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-3 border-b bg-muted/30 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedFriend(null)}
                    className="md:hidden flex-shrink-0 h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {selectedFriend.avatar ? (
                      <AvatarImage src={selectedFriend.avatar} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground font-pixelated text-xs">
                        {selectedFriend.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm font-pixelated">{selectedFriend.name}</p>
                    <p className="text-xs text-muted-foreground truncate font-pixelated">
                      @{selectedFriend.username}
                      {selectedFriend.isBlocked && (
                        <span className="ml-2 text-destructive font-pixelated">
                          • No longer friends
                        </span>
                      )}
                    </p>
                  </div>
                  {selectedFriend.isBlocked && (
                    <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                </div>

                {/* Messages Area and Input - Fixed layout with proper spacing */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages Area - Takes remaining space with smooth scrolling */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea 
                      ref={messagesContainerRef}
                      className="h-full scroll-smooth"
                    >
                      <div className="p-3 space-y-2">
                        {/* Show "Start chatting" message when no messages exist */}
                        {messageGroups.length === 0 && !selectedFriend.isBlocked && (
                          <div className="text-center py-8">
                            <div className="bg-muted/30 border border-muted rounded-lg p-6 max-w-md mx-auto">
                              <Heart className="h-8 w-8 text-social-green mx-auto mb-3" />
                              <p className="font-pixelated text-sm font-medium text-foreground mb-2">
                                Start your conversation
                              </p>
                              <p className="font-pixelated text-xs text-muted-foreground">
                                Say hello to {selectedFriend.name}! This is the beginning of your chat history.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedFriend.isBlocked && (
                          <div className="text-center py-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-w-md mx-auto">
                              <UserX className="h-6 w-6 text-destructive mx-auto mb-2" />
                              <p className="font-pixelated text-xs text-destructive font-medium">
                                You are no longer friends
                              </p>
                              <p className="font-pixelated text-xs text-muted-foreground mt-1">
                                You cannot send or receive messages from this user
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Message Input - Fixed at bottom with better spacing */}
                  <div className="border-t bg-background flex-shrink-0 pb-safe">
                    {selectedFriend.isBlocked ? (
                      <div className="text-center py-4">
                        <p className="font-pixelated text-xs text-muted-foreground">
                          You cannot send messages to this user
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        <div className="flex gap-2 items-end">
                          <Textarea 
                            placeholder="Type a message..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            className="min-h-[52px] max-h-[120px] resize-none flex-1 font-pixelated text-xs"
                            disabled={sendingMessage || selectedFriend.isBlocked}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sendingMessage || selectedFriend.isBlocked}
                            className="bg-primary hover:bg-primary/90 flex-shrink-0 h-[52px] w-12"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground font-pixelated">
                          Press Enter to send, Shift + Enter for new line
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2 font-pixelated">Your Messages</h2>
                <p className="text-muted-foreground font-pixelated text-sm">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Messages;