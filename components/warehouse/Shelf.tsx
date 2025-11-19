'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useWarehouse } from '@/contexts/WarehouseContext';
import DeviceCard from './DeviceCard';
import { Edit2, X, Save } from 'lucide-react';

type Shelf = {
  id: number;
  name: string;
  rows: number;
  columns: number;
  barcode?: string | null;
  section_barcode_1?: string | null;
  section_barcode_2?: string | null;
  section_barcode_3?: string | null;
  sub_category_1?: string | null;
  sub_category_2?: string | null;
  sub_category_3?: string | null;
};

type ShelfProps = {
  shelf: Shelf;
};

const Shelf = ({ shelf }: ShelfProps) => {
  const { devices, selectedDeviceId, gridSize } = useWarehouse();
  const totalSlots = shelf.rows * shelf.columns;
  
  // Get devices assigned to this shelf
  const shelfDevices = devices.filter(
    (d) => d.shelf_id === shelf.id && d.slot_index !== null
  );

  // Create slots array
  const slots: (typeof devices[0] | null)[] = Array(totalSlots).fill(null);
  shelfDevices.forEach((device) => {
    if (device.slot_index !== null && device.slot_index < totalSlots) {
      slots[device.slot_index] = device;
    }
  });

  const slotSizeClass = {
    small: 'min-h-[60px] text-[8px]',
    medium: 'min-h-[80px] text-xs',
    large: 'min-h-[100px] text-sm',
  };

  // Group slots into chunks of 2 rows
  const slotsPerGroup = shelf.columns * 2; // 2 rows worth of slots
  const groups: (typeof devices[0] | null)[][] = [];
  
  for (let i = 0; i < slots.length; i += slotsPerGroup) {
    groups.push(slots.slice(i, i + slotsPerGroup));
  }

  // Get sub-category names (default to Section 1, 2, 3 if not set)
  const subCategoryNames = [
    shelf.sub_category_1 || 'Section 1',
    shelf.sub_category_2 || 'Section 2',
    shelf.sub_category_3 || 'Section 3',
  ];

  // Get section barcodes
  const sectionBarcodes = [
    shelf.section_barcode_1,
    shelf.section_barcode_2,
    shelf.section_barcode_3,
  ];

  return (
    <div id={`shelf-${shelf.id}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {shelf.name}
          </h3>
          {shelf.barcode && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg font-mono font-bold text-sm text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-600 shadow-sm">
              {shelf.barcode}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {shelf.rows}×{shelf.columns} ({totalSlots} slots)
        </div>
      </div>
      <div className="space-y-4">
        {groups.map((group, groupIndex) => {
          const startIndex = groupIndex * slotsPerGroup;
          const subCategoryName = subCategoryNames[groupIndex] || `Section ${groupIndex + 1}`;
          const sectionBarcode = sectionBarcodes[groupIndex] || `ShSec${groupIndex + 1}`;
          
          return (
            <div key={groupIndex} className="space-y-2">
              {/* Sub-category header with barcode */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-3 px-3 py-1">
                  <SubCategoryHeader
                    shelf={shelf}
                    groupIndex={groupIndex}
                    subCategoryName={subCategoryName}
                  />
                  <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg font-mono font-bold text-xs text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600">
                    {sectionBarcode}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
              </div>
              
              {/* Slots grid */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${shelf.columns}, 1fr)`,
                }}
              >
                {group.map((device, slotIndexInGroup) => {
                  const index = startIndex + slotIndexInGroup;
                  const slotId = `shelf-${shelf.id}-slot-${index}`;
                  const isHighlighted = selectedDeviceId === device?.id;
                  // Generate slot identifier: {sectionBarcode}.{slotInSection}
                  const slotInSection = slotIndexInGroup + 1;
                  const slotIdentifier = `${sectionBarcode}.${slotInSection}`;
                  
                  return (
                    <ShelfSlot
                      key={slotId}
                      slotId={slotId}
                      device={device}
                      slotIndex={index}
                      slotIdentifier={slotIdentifier}
                      isHighlighted={isHighlighted}
                      slotSizeClass={slotSizeClass[gridSize]}
                      gridSize={gridSize}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type ShelfSlotProps = {
  slotId: string;
  device: any | null;
  slotIndex: number;
  slotIdentifier: string;
  isHighlighted: boolean;
  slotSizeClass: string;
  gridSize: 'small' | 'medium' | 'large';
};

const ShelfSlot = ({ slotId, device, slotIndex, slotIdentifier, isHighlighted, slotSizeClass, gridSize }: ShelfSlotProps) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const isDraggingOver = isOver && !device;
  const isInvalidDrop = isOver && device && active?.id !== device.id;

  return (
    <div
      ref={setNodeRef}
      id={slotId}
      className={`
        aspect-square border-2 rounded-lg p-1 transition-all duration-200
        ${device
          ? isHighlighted
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 ring-2 ring-yellow-400'
            : 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : isDraggingOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 border-dashed scale-105 shadow-lg'
          : isInvalidDrop
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${slotSizeClass}
      `}
    >
      {device ? (
        <DeviceCard device={device} isDragging={false} isInPool={false} gridSize={gridSize} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <span className="text-gray-400 dark:text-gray-500 font-mono font-semibold text-xs">
            {slotIdentifier}
          </span>
          <span className="text-gray-300 dark:text-gray-600 font-mono text-[10px]">
            {slotIndex + 1}
          </span>
        </div>
      )}
    </div>
  );
};

// Sub-category header component with inline editing
type SubCategoryHeaderProps = {
  shelf: Shelf;
  groupIndex: number;
  subCategoryName: string;
};

const SubCategoryHeader = ({ shelf, groupIndex, subCategoryName }: SubCategoryHeaderProps) => {
  const { updateShelf } = useWarehouse();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subCategoryName);

  const handleSave = async () => {
    const fieldName = `sub_category_${groupIndex + 1}` as 'sub_category_1' | 'sub_category_2' | 'sub_category_3';
    await updateShelf(shelf.id, { [fieldName]: editValue.trim() || `Section ${groupIndex + 1}` });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(subCategoryName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-[100px]"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          title="Save"
        >
          <Save className="w-3 h-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 group">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {subCategoryName}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
        title="Edit sub-category name"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Shelf;

