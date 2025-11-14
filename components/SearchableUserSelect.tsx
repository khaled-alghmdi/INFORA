'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';

type User = {
  id: string;
  full_name: string;
  email: string;
  department: string;
};

type SearchableUserSelectProps = {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  showAllOption?: boolean;
};

const SearchableUserSelect = ({ 
  users, 
  value, 
  onChange, 
  placeholder = "Select User",
  showAllOption = true
}: SearchableUserSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected user details
  const selectedUser = users.find(u => u.id === value);
  const displayText = value === 'all' 
    ? 'All Users' 
    : selectedUser 
    ? `${selectedUser.full_name} - ${selectedUser.department}`
    : placeholder;

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.full_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.department.toLowerCase().includes(searchLower)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('all');
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 pl-12 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer font-medium text-left flex items-center justify-between"
      >
        <span>{displayText}</span>
        <div className="flex items-center gap-2">
          {value !== 'all' && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
          <svg 
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* User Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border-2 border-green-300 dark:border-green-700 rounded-lg shadow-2xl max-h-96 flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* User List */}
          <div className="overflow-y-auto">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors border-b border-gray-100 dark:border-gray-600 ${
                  value === 'all' ? 'bg-green-500 text-white hover:bg-green-600' : 'text-gray-900 dark:text-white font-semibold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>All Users</span>
                  {value === 'all' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            )}
            
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = user.id === value;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                      isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.full_name}
                        </div>
                        <div className={`text-xs mt-1 truncate ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {user.department} • {user.email}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableUserSelect;

