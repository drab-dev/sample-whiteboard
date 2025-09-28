import React, { useState } from 'react';
import { MoreVertical, CreditCard as Edit3, Trash2, Share2, Users, Clock, CreditCard as Edit } from 'lucide-react';
import { Whiteboard } from '../../types';

interface WhiteboardCardProps {
  whiteboard: Whiteboard;
  onSelect: () => void;
  onDelete: () => void;
  onShare: () => void;
  onUpdateTitle: (newTitle: string) => void;
  isOwner: boolean;
  formatDate: (date: string) => string;
}

export const WhiteboardCard: React.FC<WhiteboardCardProps> = ({
  whiteboard,
  onSelect,
  onDelete,
  onShare,
  onUpdateTitle,
  isOwner,
  formatDate
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(whiteboard.title);

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== whiteboard.title) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(whiteboard.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden">
      {/* Preview Area */}
      <div 
        onClick={onSelect}
        className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer flex items-center justify-center border-b border-gray-100 group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors"
      >
        <div className="text-center">
          <Edit3 size={32} className="mx-auto text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
          <p className="text-sm text-gray-500">Click to open</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyPress}
              className="text-lg font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 flex-1 mr-2"
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-gray-900 flex-1 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={onSelect}
            >
              {whiteboard.title}
            </h3>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Edit size={14} className="mr-2" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onShare();
                    setShowMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Share2 size={14} className="mr-2" />
                  Share
                </button>
                {isOwner && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-2" />
            <span>Last edited {formatDate(whiteboard.updated_at)}</span>
          </div>

          {whiteboard.collaborators && whiteboard.collaborators.length > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Users size={14} className="mr-2" />
              <span>
                {whiteboard.collaborators.length} collaborator{whiteboard.collaborators.length > 1 ? 's' : ''}
              </span>
              <div className="ml-3 flex -space-x-2">
                {whiteboard.collaborators.slice(0, 3).map((collaborator, index) => (
                  <div
                    key={index}
                    className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    title={`${collaborator.name} (${collaborator.permission})`}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {whiteboard.collaborators.length > 3 && (
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                    +{whiteboard.collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onSelect}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200"
        >
          Open Whiteboard
        </button>
      </div>
    </div>
  );
};