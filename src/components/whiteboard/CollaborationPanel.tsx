import React, { useState, useEffect } from 'react';
import { X, Link, Copy, Users, Shield, MessageCircle, CreditCard as Edit3, Check, ExternalLink } from 'lucide-react';
import { Whiteboard, ShareLink } from '../../types';

interface CollaborationPanelProps {
  whiteboard: Whiteboard;
  onClose: () => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  whiteboard,
  onClose
}) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [newLinkPermission, setNewLinkPermission] = useState<'viewer' | 'commenter' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchShareLinks();
  }, []);

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboard.id}/share-links`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    }
  };

  const createShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/whiteboards/${whiteboard.id}/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission: newLinkPermission }),
        credentials: 'include'
      });

      if (response.ok) {
        const newLink = await response.json();
        setShareLinks(prev => [...prev, newLink]);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const deleteShareLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboard.id}/share-links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setShareLinks(prev => prev.filter(link => link.id !== linkId));
      }
    } catch (error) {
      console.error('Failed to delete share link:', error);
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'viewer':
        return <Shield size={16} className="text-blue-500" />;
      case 'commenter':
        return <MessageCircle size={16} className="text-green-500" />;
      case 'editor':
        return <Edit3 size={16} className="text-purple-500" />;
      default:
        return <Shield size={16} className="text-gray-500" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'viewer':
        return 'bg-blue-100 text-blue-800';
      case 'commenter':
        return 'bg-green-100 text-green-800';
      case 'editor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Collaboration</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current Collaborators */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Users size={16} className="mr-2" />
            Current Collaborators
          </h4>
          
          {whiteboard.collaborators && whiteboard.collaborators.length > 0 ? (
            <div className="space-y-2">
              {whiteboard.collaborators.map((collaborator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{collaborator.name}</p>
                      <p className="text-xs text-gray-500">{collaborator.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(collaborator.permission)}`}>
                    {collaborator.permission}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No collaborators yet</p>
          )}
        </div>

        {/* Share Links */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Link size={16} className="mr-2" />
            Share Links
          </h4>

          {/* Create New Link */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <select
                value={newLinkPermission}
                onChange={(e) => setNewLinkPermission(e.target.value as any)}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
              </select>
              <button
                onClick={createShareLink}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Anyone in your organization with this link can access the whiteboard with {newLinkPermission} permissions.
            </p>
          </div>

          {/* Existing Links */}
          {shareLinks.length > 0 ? (
            <div className="space-y-3">
              {shareLinks.map((link) => (
                <div key={link.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(link.permission)}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {link.permission} Link
                      </span>
                    </div>
                    <button
                      onClick={() => deleteShareLink(link.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/shared/${link.id}`}
                      readOnly
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/shared/${link.id}`)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Copy Link"
                    >
                      {copiedLink === `${window.location.origin}/shared/${link.id}` ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => window.open(`${window.location.origin}/shared/${link.id}`, '_blank')}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Open Link"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No share links created yet</p>
          )}
        </div>

        {/* Organization Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Organization Access</h4>
          <p className="text-xs text-blue-700">
            Only members of your organization can access shared links. External users will need to be invited directly.
          </p>
        </div>
      </div>
    </div>
  );
};