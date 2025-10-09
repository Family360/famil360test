// Tip Distribution Modals - Add Staff & Add Tip
import React, { useState } from 'react';
import { X, UserPlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';
import Input from './Input';
import { StaffMember, TipEntry } from '@/services/tipDistributionService';

// Add Staff Modal
interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (staff: Omit<StaffMember, 'id' | 'createdAt'>) => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<{
    name: string;
    role: StaffMember['role'];
    sharePercentage: number;
    active: boolean;
  }>({
    name: '',
    role: 'waiter',
    sharePercentage: 25,
    active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: '', role: 'waiter', sharePercentage: 25, active: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="glass-strong rounded-2xl shadow-floating max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <UserPlus size={24} className="mr-2 text-orange-500" />
            Add Staff Member
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter staff name"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffMember['role'] })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="chef">Chef</option>
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="helper">Helper</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Share Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Share Percentage (%)
            </label>
            <input
              type="number"
              value={formData.sharePercentage}
              onChange={(e) => setFormData({ ...formData, sharePercentage: Number(e.target.value) })}
              min="0"
              max="100"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of tips this staff member receives
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
              Active (receives tips)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
            >
              Add Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Tip Modal
interface AddTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tip: Omit<TipEntry, 'id' | 'distributed'>) => void;
}

export const AddTipModal: React.FC<AddTipModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<{
    amount: string;
    source: TipEntry['source'];
    notes: string;
  }>({
    amount: '',
    source: 'cash',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      amount: Number(formData.amount),
      date: new Date().toISOString(),
      source: formData.source,
      notes: formData.notes || undefined,
    });
    setFormData({ amount: '', source: 'cash', notes: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="glass-strong rounded-2xl shadow-floating max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <DollarSign size={24} className="mr-2 text-green-500" />
            Add Tip
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'digital'] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setFormData({ ...formData, source })}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all capitalize',
                    formData.source === source
                      ? 'bg-orange-500 text-white shadow-elevated'
                      : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/60'
                  )}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
            >
              Add Tip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
