import React from 'react';
import { Users } from 'lucide-react';
import { ActiveUser } from '../../types';

interface ActiveCollaboratorsProps {
  users: ActiveUser[];
}

export const ActiveCollaborators: React.FC<ActiveCollaboratorsProps> = ({ users }) => {
  if (users.length === 0) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Users size={16} className="mr-1" />
        <span>No one online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm text-gray-600">
        <Users size={16} className="mr-1" />
        <span>{users.length} online</span>
      </div>
      
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-sm">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};