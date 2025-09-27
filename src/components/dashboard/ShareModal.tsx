import React, { useState } from 'react';
import { X, Mail, UserPlus, Users, Shield, MessageCircle, CreditCard as Edit3 } from 'lucide-react';
import { Whiteboard } from '../../types';

interface ShareModalProps {
  whiteboard: Whiteboard;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ whiteboard, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'commenter' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/whiteboards/${whiteboard.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), permission }),
        credentials: 'include'
      });

      if (response.ok) {
        setMessage('Whiteboard shared successfully!');
        setEmail('');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to share whiteboard');
      }
    } catch (error) {
      setMessage('Failed to share whiteboard');
    } finally {
      setLoading(false);
    }
  };

  const permissionOptions = [
    { value: 'viewer', label: 'Viewer', icon: Shield, description: 'Can only view the whiteboard' },
    { value: 'commenter', label: 'Commenter', icon: MessageCircle, description: 'Can view and add comments' },
    { value: 'editor', label: 'Editor', icon: Edit3, description: 'Can edit and modify the whiteboard' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Share Whiteboard</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{whiteboard.title}</h3>
          {whiteboard.collaborators && whiteboard.collaborators.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <Users size={14} className="mr-2" />
              <span>{whiteboard.collaborators.length} current collaborator{whiteboard.collaborators.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleShare}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter collaborator's email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permission Level
            </label>
            <div className="space-y-2">
              {permissionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    permission === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="permission"
                    value={option.value}
                    checked={permission === option.value}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="sr-only"
                  />
                  <option.icon size={18} className={`mr-3 ${permission === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-medium ${permission === option.value ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${permission === option.value ? 'text-blue-700' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sharing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus size={16} className="mr-2" />
                  Share
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};