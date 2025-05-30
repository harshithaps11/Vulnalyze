import { useState } from 'react';
import { Users, MessageSquare, UserPlus, Video, Mic, Share2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  color: string;
}

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface TeamCollaborationProps {
  isDarkMode: boolean;
}

export const TeamCollaboration = ({ isDarkMode }: TeamCollaborationProps) => {
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
  const [message, setMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      avatar: 'JD',
      role: 'Security Lead',
      status: 'online',
      color: '#3b82f6'
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: 'JS',
      role: 'Developer',
      status: 'online',
      color: '#10b981'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      avatar: 'MJ',
      role: 'QA Engineer',
      status: 'away',
      color: '#f59e0b'
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      user: 'John Doe',
      text: 'Found a potential XSS vulnerability in the login form.',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      user: 'Jane Smith',
      text: 'I\'ll take a look at that. Can you share the code snippet?',
      timestamp: '10:32 AM'
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Add message sending logic here
    setMessage('');
  };

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className={`border-b ${
        isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 text-sm font-medium flex items-center ${
              activeTab === 'members'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 text-sm font-medium flex items-center ${
              activeTab === 'chat'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </button>
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'members' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Team Members</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg ${
                  isDarkMode
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </button>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{member.name}</p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      member.status === 'online' ? 'bg-green-500' :
                      member.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <button className={`p-2 rounded-lg ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Video className="w-4 h-4" />
                    </button>
                    <button className={`p-2 rounded-lg ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Team Chat</h3>
              <button className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}>
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <div className={`h-[300px] overflow-y-auto space-y-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{msg.user}</span>
                    <span className="text-xs opacity-50">{msg.timestamp}</span>
                  </div>
                  <p className="mt-1">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Invite Team Member</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email address"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 