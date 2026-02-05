import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Send, Search, Plus, MoreVertical, Phone, Video, Paperclip, Smile, X, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {  companyId } from '../../constants/appConstants';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessageToStaff } from '../../constants/firebase';
// Firebase will be initialized externally - this componen

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  fcmToken?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'file' | 'image';
}

interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  role?: string;
  memberCount?: number;
  companyId?: string;
  createdAt?: Date;
  messages: Message[];
}

// You'll need to pass these props or get them from context/auth
interface ChatProps {
  id: string;
  currentUserRole: 'user' | 'staff';
  companyId: string;
}

const Chat: React.FC<ChatProps> = ({
}) => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { company } = useAuth();
  const [isSendingMessageToStaff, setIsSendingMessageToStaff] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

// Initialize chat system
useEffect(() => {
  let unsubscribe: (() => void) | undefined;

  const initializeChats = async () => {
    try {
      setLoading(true); // Set loading to true at the very beginning

      // 1. Fetch user data FIRST
      const userDoc = await getDoc(doc(db, 'companies', companyId));
      let fetchedUser: User | null = null;
      if (userDoc.exists()) {
        fetchedUser = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(fetchedUser);
        }

      // 2. Fetch all staff data SECOND
      const staffQuery = query(collection(db, 'companies', companyId, 'staff'));
      const staffSnapshot = await getDocs(staffQuery);
      const staffList: Staff[] = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(staffList);

      // Auto-create chat rooms if needed (optional)
      await createDefaultChatRooms(staffList);

      // 3. FINALLY, fetch chat rooms - this now waits for initial data to be processed
      unsubscribe = await fetchChatRooms();
      
      } catch (error) {
      } finally {
      // This now correctly runs AFTER the initial chat rooms are loaded and processed
      setLoading(false);
    }
  };

  if (companyId && company?.id) {
    initializeChats();
  }
  
  // Cleanup function to unsubscribe from the listener when the component unmounts
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [companyId, company?.id]);  // Create default chat rooms

  const createDefaultChatRooms = async (staffList: Staff[]) => {
  try {
    const chatRoomsRef = collection(db, 'companies', companyId, 'chatrooms');
    
    // Determine current user's role based on available data
    // If company?.id === companyId, then current user is the company owner (user)
    // Otherwise, current user is a staff member
    const isCompanyOwner = company?.id === companyId;
    const currentUserId = company?.id;
    
    // 1. Create "All Staff" group chat
    const allStaffChatId = `${companyId}_all_staff`;
    const allStaffChatRef = doc(chatRoomsRef, allStaffChatId);
    const allStaffChatDoc = await getDoc(allStaffChatRef);
    
    if (!allStaffChatDoc.exists()) {
      const allParticipants = [companyId, ...staffList.map(s => s.id)];
      await setDoc(allStaffChatRef, {
        type: 'group',
        name: 'All Staff',
        participants: allParticipants,
        createdBy: companyId,
        createdAt: serverTimestamp(),
        lastMessage: 'Chat created',
        lastMessageTime: serverTimestamp(),
        memberCount: allParticipants.length
      });
      
      // Add welcome message
      await addDoc(collection(allStaffChatRef, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        content: 'Welcome to the All Staff group chat!',
        timestamp: serverTimestamp(),
        type: 'text',
        status: 'delivered'
      });
    }

    // 2. Create direct chats between company and each staff member
    for (const staffMember of staffList) {
      const directChatId = `${companyId}_${staffMember.id}`;
      const directChatRef = doc(chatRoomsRef, directChatId);
      const directChatDoc = await getDoc(directChatRef);
      
      if (!directChatDoc.exists()) {
        await setDoc(directChatRef, {
          type: 'direct',
          name: isCompanyOwner ? staffMember.name : user?.name || 'Company',
          participants: [companyId, staffMember.id],
          createdAt: serverTimestamp(),
          lastMessage: 'Chat created, start a conversation!',
          lastMessageTime: serverTimestamp(),
          memberCount: 2
        });
        
        // Add welcome message
        await addDoc(collection(directChatRef, 'messages'), {
          senderId: 'system',
          senderName: 'System',
          content: 'Direct chat created. Start your conversation!',
          timestamp: serverTimestamp(),
          type: 'text',
          status: 'delivered'
        });
      }
    }
    
    // 3. If current user is a staff member, ensure there's a direct chat with the company owner
    if (!isCompanyOwner && currentUserId) {
      const directChatId = `${companyId}_${currentUserId}`;
      const directChatRef = doc(chatRoomsRef, directChatId);
      const directChatDoc = await getDoc(directChatRef);
      
      if (!directChatDoc.exists()) {
        await setDoc(directChatRef, {
          type: 'direct',
          name: user?.name || 'Company',
          participants: [companyId, currentUserId],
          createdAt: serverTimestamp(),
          lastMessage: 'Chat created',
          lastMessageTime: serverTimestamp(),
        });
        
        // Add welcome message
        await addDoc(collection(directChatRef, 'messages'), {
          senderId: 'system',
          senderName: 'System',
          content: 'Direct chat created. Start your conversation!',
          timestamp: serverTimestamp(),
          type: 'text',
          status: 'delivered'
        });
      }
    }
    
  } catch (error) {
    console.error('Error creating default chat rooms:', error);
  }
};

// Fetch chat rooms from Firestore
const fetchChatRooms = () => {
  // 1. Return a new Promise
  return new Promise<() => void>((resolve, reject) => {
    try {
      const chatRoomsRef = collection(db, 'companies', companyId, 'chatrooms');
      const chatRoomsQuery = query(chatRoomsRef, orderBy('lastMessageTime', 'desc'));

      let isInitialLoad = true; // Flag to resolve the promise only once

      const unsubscribe = onSnapshot(chatRoomsQuery, async (snapshot) => {
        try {
          const roomsPromises = snapshot.docs.map(async (docSnapshot) => {
            const roomData = docSnapshot.data();

            // Filter rooms where the current user is a participant
            if (!roomData.participants?.includes(company?.id)) {
              return null; // Return null for rooms to be filtered out
            }

            // Fetch last few messages... (your message fetching logic is fine)
            const messagesRef = collection(docSnapshot.ref, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
            const messagesSnapshot = await getDocs(messagesQuery);
            
            const messages: Message[] = messagesSnapshot.docs.map(msgDoc => {
               const msgData = msgDoc.data();
               return {
                  id: msgDoc.id,
                  content: msgData.content || '',
                  timestamp: msgData.timestamp?.toMillis() || Date.now(),
                  senderId: msgData.senderId || 'system',
                  senderName: msgData.senderName || '',
                  status: msgData.status || 'sent',
                  type: msgData.type || 'text'
               };
            }).reverse(); // Map and then reverse is slightly more efficient
            
            // Determine chat display info using passed-in data
            let displayName = roomData.name;
            let avatar = roomData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
            let isOnline = false;
            let role = '';
            let memberCount = roomData.memberCount;

            if (roomData.type === 'direct') {
              const otherParticipantId = roomData.participants.find((p: string) => p !== company?.id);
              if (otherParticipantId === companyId) {
                displayName = user?.name || 'User';
                role = 'user';
              } else {
                const staffMember = staff.find(s => s.id === otherParticipantId);
                if (staffMember) {
                  displayName = staffMember.name;
                  role = staffMember.role;
                  isOnline = staffMember.isOnline || false;
                }
              }
               avatar = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
            }

            const lastMessage = messages[messages.length - 1];

            // Return the fully formed chat room object
            return {
              id: docSnapshot.id,
              // ... all your ChatRoom properties
              lastMessage: lastMessage?.content || roomData.lastMessage,
              lastMessageTime: formatTime(lastMessage?.timestamp || roomData.lastMessageTime?.toMillis()),
              messages: messages,
              name: displayName,
              memberCount: memberCount,
            } as ChatRoom;
          });

          // Wait for all the message-fetching and data-processing to complete
          const rooms = (await Promise.all(roomsPromises)).filter(Boolean) as ChatRoom[];
          
          setChatRooms(rooms);

          // 2. On the very first data load, resolve the promise AFTER data is set
          if (isInitialLoad) {
            isInitialLoad = false;
            resolve(unsubscribe); // Resolve with the unsubscribe function for cleanup
          }
        } catch (snapshotError) {
          console.error("Error processing snapshot data:", snapshotError);
          if (isInitialLoad) {
            reject(snapshotError);
          }
        }
      }, (error) => {
          // Reject the promise if the listener fails
          console.error("Error in onSnapshot:", error);
          reject(error);
      });
    } catch (error) {
      console.error('Error setting up chat room listener:', error);
      reject(error);
    }
  });
};

const filteredChats = chatRooms.filter(chat =>
  chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
);
  const currentChat = chatRooms.find(chat => chat.id === selectedChat);

  
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      setIsSendingMessageToStaff(true);
      const messageData = {
        senderId: company?.id,
        senderName: company?.companyName,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        type: 'text',
        status: 'sent'
      };

      const chatRef = doc(db, 'companies', companyId, 'chatrooms', selectedChat);
      const messagesRef = collection(chatRef, 'messages');
      const chatSnap = await getDoc(chatRef);
      const chatData = chatSnap.data();
      const participants = chatData?.participants;
      
      // Add message to Firestore
      await addDoc(messagesRef, messageData);
      
      // Update chat room's last message
      await updateDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
      });

      await sendMessageToStaff(companyId, participants[1], company?.companyName, newMessage.trim(), {});

      setNewMessage('');
      setTimeout(scrollToBottom, 100);
      setIsSendingMessageToStaff(false);
      
    } catch (error) {
      setIsSendingMessageToStaff(false);
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <span className="text-sm text-gray-500">
              {staff.find(s => s.id === company?.id)?.name}
            </span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    chat.type === 'group' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {chat.name.substring(0, 2).toLocaleUpperCase()}
                  </div>
                  {chat.type === 'direct' && chat.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                      {chat.type === 'group' && (
                        <div className="flex items-center text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          <span className="text-xs">{chat.memberCount}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                  </div>
                  
                  {chat.type === 'direct' && chat.role && (
                    <p className="text-xs text-gray-500 mb-1">{chat.role}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className={`flex-1 flex flex-col bg-white ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    currentChat?.type === 'group' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {currentChat?.avatar}
                  </div>
                  {currentChat?.type === 'direct' && currentChat?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentChat?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {currentChat?.type === 'direct' 
                      ? currentChat?.role || (currentChat?.isOnline ? 'Online' : 'Last seen recently')
                      : `${currentChat?.memberCount} members`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentChat?.type === 'direct' && (
                  <>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {currentChat?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === company?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.senderId === company?.id ? 'ml-4' : 'mr-4'
                }`}>
                  {currentChat.type === 'group' && message.senderId !== company?.id && message.senderId !== 'system' && (
                    <p className="text-xs text-gray-500 mb-1 ml-3">{message.senderName || 'Staff Member'}</p>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.senderId === 'system'
                      ? 'bg-gray-200 text-gray-600 text-center italic'
                      : message.senderId === company?.id
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.senderId !== 'system' && (
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        message.senderId === company?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(message.timestamp)}</span>
                        {message.senderId === company?.id && getStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </button>
              
               {
                !isSendingMessageToStaff ? (
                  <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              > 
                <Send className="w-5 h-5" />
              </button>
                ) : <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-2"></div>
                       </div>    
               }
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Messages</h3>
            <p className="text-gray-500 mb-2">
              {'Connect with your user and colleagues'
              }
            </p>
            <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;