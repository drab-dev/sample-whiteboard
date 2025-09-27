import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, LogOut, Users, Clock, CreditCard as Edit3, Trash2, Share2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Whiteboard } from '../../types';
import { WhiteboardCard } from './WhiteboardCard';
import { CreateWhiteboardModal } from './CreateWhiteboardModal';
import { ShareModal } from './ShareModal';

export const Dashboard: React.FC<{ onSelectWhiteboard: (id: string) => void }> = ({ onSelectWhiteboard }) => {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareModalBoard, setShareModalBoard] = useState<Whiteboard | null>(null);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchWhiteboards();
  }, []);

  const fetchWhiteboards = async () => {
    try {
      const response = await fetch('/api/whiteboards', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWhiteboards(data);
      }
    } catch (error) {
      console.error('Failed to fetch whiteboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWhiteboard = async (title: string) => {
    try {
      const response = await fetch('/api/whiteboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
        credentials: 'include'
      });

      if (response.ok) {
        await fetchWhiteboards();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create whiteboard:', error);
    }
  };

  const handleDeleteWhiteboard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this whiteboard?')) return;

    try {
      const response = await fetch(`/api/whiteboards/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setWhiteboards(whiteboards.filter(wb => wb.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete whiteboard:', error);
    }
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/whiteboards/${id}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
        credentials: 'include'
      });

      if (response.ok) {
        setWhiteboards(whiteboards.map(wb => 
          wb.id === id ? { ...wb, title: newTitle } : wb
        ));
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const filteredWhiteboards = whiteboards.filter(wb =>
    wb.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhiteBoard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              New Whiteboard
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search whiteboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit3 size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Boards</p>
                <p className="text-2xl font-bold text-gray-900">{whiteboards.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collaborations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {whiteboards.reduce((acc, wb) => acc + (wb.collaborators?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {whiteboards.filter(wb => {
                    const daysSinceUpdate = Math.ceil(
                      (new Date().getTime() - new Date(wb.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysSinceUpdate <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Whiteboards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWhiteboards.map((whiteboard) => (
            <WhiteboardCard
              key={whiteboard.id}
              whiteboard={whiteboard}
              onSelect={() => onSelectWhiteboard(whiteboard.id)}
              onDelete={() => handleDeleteWhiteboard(whiteboard.id)}
              onShare={() => setShareModalBoard(whiteboard)}
              onUpdateTitle={(newTitle) => handleUpdateTitle(whiteboard.id, newTitle)}
              isOwner={whiteboard.owner_id === user?.id}
              formatDate={formatDate}
            />
          ))}
        </div>

        {filteredWhiteboards.length === 0 && (
          <div className="text-center py-12">
            <Edit3 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchQuery ? 'No whiteboards found' : 'No whiteboards yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Create your first whiteboard to start collaborating'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Create Whiteboard
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateWhiteboardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWhiteboard}
        />
      )}

      {shareModalBoard && (
        <ShareModal
          whiteboard={shareModalBoard}
          onClose={() => setShareModalBoard(null)}
        />
      )}
    </div>
  );
};