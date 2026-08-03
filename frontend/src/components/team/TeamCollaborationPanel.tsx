import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { mockUsers, mockComments } from '../../data/mockData';
import { formatDate } from '../../lib/utils';

export function TeamCollaborationPanel() {
  const [showComments, setShowComments] = useState(true);
  const [comment, setComment] = useState('');

  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Team Collaboration</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">
              {mockUsers.filter(u => u.isOnline).length} online
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center">
              <CheckCircle size={14} className="mr-1.5 text-severity-low" />
              Team Members
            </h4>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {mockUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-dark-700">
                  <div className="flex items-center">
                    <Avatar 
                      src={user.avatar} 
                      alt={user.name} 
                      size="sm" 
                      status={user.isOnline ? 'online' : 'offline'}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-dark-200">{user.name}</p>
                      <p className="text-xs text-dark-400">{user.role}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs !px-2 !py-1"
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-dark-300 flex items-center">
                <MessageSquare size={14} className="mr-1.5 text-primary-500" />
                Discussion
              </h4>
              
              <button 
                className="text-xs text-dark-400 flex items-center hover:text-dark-200"
                onClick={() => setShowComments(!showComments)}
              >
                {showComments ? (
                  <>Hide <ChevronUp size={14} className="ml-0.5" /></>
                ) : (
                  <>Show <ChevronDown size={14} className="ml-0.5" /></>
                )}
              </button>
            </div>
            
            {showComments && (
              <>
                <div className="bg-dark-700 rounded-md p-3 max-h-72 overflow-y-auto mb-4">
                  {mockComments.length > 0 ? (
                    <div className="space-y-4">
                      {mockComments.map(comment => (
                        <div key={comment.id} className="flex">
                          <Avatar 
                            src={comment.user.avatar} 
                            alt={comment.user.name} 
                            size="sm" 
                            className="mr-3 mt-0.5"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-dark-200">{comment.user.name}</span>
                              <span className="mx-2 text-dark-500">•</span>
                              <span className="text-xs text-dark-400">{formatDate(comment.createdAt)}</span>
                            </div>
                            
                            <p className="text-sm text-dark-300 mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <AlertCircle size={20} className="text-dark-400 mb-2" />
                      <p className="text-sm text-dark-400">No comments yet</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Avatar 
                    src={mockUsers[0].avatar} 
                    alt={mockUsers[0].name} 
                    size="sm" 
                  />
                  <div className="flex-1">
                    <textarea
                      className="input text-sm h-20 resize-none mb-2"
                      placeholder="Add your comments or notes..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      disabled={!comment.trim()}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}