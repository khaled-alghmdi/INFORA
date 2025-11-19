'use client';

import { useState } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import Shelf from './Shelf';
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';

const ShelfGrid = () => {
  const { 
    shelves, 
    createShelf, 
    updateShelf, 
    deleteShelf, 
    gridSize 
  } = useWarehouse();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rows: 5,
    columns: 4,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    shelfId: number | null;
  }>({
    show: false,
    shelfId: null,
  });

  const handleCreate = async () => {
    try {
      await createShelf(formData.name, formData.rows, formData.columns);
      setShowCreateModal(false);
      setFormData({ name: '', rows: 5, columns: 4 });
    } catch (error) {
      // Error handled in context
    }
  };

  const handleEdit = (shelf: any) => {
    setEditingShelf(shelf.id);
    setFormData({
      name: shelf.name,
      rows: shelf.rows,
      columns: shelf.columns,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingShelf) return;
    try {
      await updateShelf(editingShelf, formData);
      setEditingShelf(null);
      setFormData({ name: '', rows: 5, columns: 4 });
    } catch (error) {
      // Error handled in context
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmation({
      show: true,
      shelfId: id,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.shelfId) return;

    try {
      await deleteShelf(deleteConfirmation.shelfId);
    } catch (error) {
      // Error handled in context
    }

    setDeleteConfirmation({
      show: false,
      shelfId: null,
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      show: false,
      shelfId: null,
    });
  };

  const gridColsClass = {
    small: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4',
    medium: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    large: 'grid-cols-1 lg:grid-cols-2',
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shelves</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Create Shelf</span>
        </button>
      </div>

      <div className={`grid ${gridColsClass[gridSize]} gap-6`}>
        {shelves.map((shelf) => (
          <div key={shelf.id} className="relative group">
            <Shelf shelf={shelf} />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(shelf)}
                className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Edit Shelf"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(shelf.id)}
                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Delete Shelf"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Shelf Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Shelf</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shelf Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Shelf A, Main Storage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Shelf identifier (e.g., Cat1, Cat2) will be auto-generated
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.columns}
                    onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Slots: {formData.rows * formData.columns}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Shelf
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shelf Modal */}
      {editingShelf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Shelf</h3>
              <button
                onClick={() => setEditingShelf(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shelf Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.columns}
                    onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Slots: {formData.rows * formData.columns}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingShelf(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Delete shelf confirmation dialog"
          tabIndex={-1}
          onClick={handleCancelDelete}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              handleCancelDelete();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900"
            role="document"
            tabIndex={0}
            aria-label="Delete shelf confirmation content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="h-10 w-10 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold">Delete Shelf</p>
                <p className="text-sm text-red-600 dark:text-red-200/80">
                  Are you sure you want to delete this shelf?
                </p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
              <p>This will permanently delete the shelf and unassign all devices. This action cannot be undone.</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-32"
                tabIndex={0}
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-center font-semibold text-white transition hover:from-red-700 hover:to-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:w-32"
                tabIndex={0}
                aria-label="Confirm delete shelf"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShelfGrid;
