'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

type Device = {
  id: string;
  name: string;
  type: string;
  asset_number: string | null;
  serial_number: string;
  status: string;
};

type SearchableDeviceSelectProps = {
  devices: Device[];
  value: string;
  onChange: (deviceId: string) => void;
  placeholder?: string;
  required?: boolean;
};

const SearchableDeviceSelect = ({ 
  devices, 
  value, 
  onChange, 
  placeholder = "-- Select Device --",
  required = false 
}: SearchableDeviceSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(devices);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected device details
  const selectedDevice = devices.find(d => d.id === value);
  const displayText = selectedDevice 
    ? `${selectedDevice.name} - ${selectedDevice.type} ${selectedDevice.asset_number ? `(#${selectedDevice.asset_number})` : `(${selectedDevice.serial_number})`}`
    : placeholder;

  // Filter devices based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(device => {
        const searchLower = searchTerm.toLowerCase();
        return (
          device.name.toLowerCase().includes(searchLower) ||
          device.type.toLowerCase().includes(searchLower) ||
          device.asset_number?.toLowerCase().includes(searchLower) ||
          device.serial_number.toLowerCase().includes(searchLower)
        );
      });
      setFilteredDevices(filtered);
    }
  }, [searchTerm, devices]);

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

  const handleSelect = (deviceId: string) => {
    onChange(deviceId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
      >
        <span className={!value ? 'text-gray-400 dark:text-gray-500' : ''}>
          {displayText}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-700 rounded-lg shadow-2xl max-h-80 flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Found {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Device List */}
          <div className="overflow-y-auto">
            {filteredDevices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No devices found
              </div>
            ) : (
              filteredDevices.map((device) => {
                const isSelected = device.id === value;
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleSelect(device.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                      isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {device.name} - {device.type}
                        </div>
                        <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {device.asset_number ? `Asset: #${device.asset_number}` : `Serial: ${device.serial_number}`}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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

export default SearchableDeviceSelect;

