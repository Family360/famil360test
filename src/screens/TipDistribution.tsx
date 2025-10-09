// Tip Distribution Management Screen
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Settings as SettingsIcon,
  Download,
  Calendar,
  PieChart,
  UserPlus,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
import { useToast } from '@/components/ui/use-toast';
import { 
  tipDistributionService, 
  StaffMember, 
  TipEntry 
} from '@/services/tipDistributionService';
import { currencyService } from '@/services/currencyService';
import { AnimatedBarChart, AnimatedDonutChart } from '@/components/AnimatedChart';
import { AddStaffModal, AddTipModal } from '@/components/TipModals';

interface TipDistributionProps {
  onNavigate?: (screen: string) => void;
}

const TipDistribution: React.FC<TipDistributionProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'tips' | 'reports'>('overview');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tips, setTips] = useState<TipEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddTipModal, setShowAddTipModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffData, tipsData, summaryData, earningsData] = await Promise.all([
        tipDistributionService.getStaffMembers(),
        tipDistributionService.getTipEntries(),
        tipDistributionService.getTipSummary(),
        tipDistributionService.getAllStaffEarnings(),
      ]);

      setStaff(staffData);
      setTips(tipsData);
      setSummary(summaryData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading tip data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tip distribution data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (staffData: Omit<StaffMember, 'id' | 'createdAt'>) => {
    try {
      await tipDistributionService.addStaffMember(staffData);
      await loadData();
      setShowAddStaffModal(false);
      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add staff member',
        variant: 'destructive',
      });
    }
  };

  const handleAddTip = async (tipData: Omit<TipEntry, 'id' | 'distributed'>) => {
    try {
      await tipDistributionService.addTipEntry(tipData);
      await loadData();
      setShowAddTipModal(false);
      toast({
        title: 'Success',
        description: 'Tip added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add tip',
        variant: 'destructive',
      });
    }
  };

  const handleDistributeTip = async (tipId: string) => {
    try {
      await tipDistributionService.distributeTip(tipId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Tip distributed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to distribute tip',
        variant: 'destructive',
      });
    }
  };

  const handleDistributeAll = async () => {
    try {
      const pendingTips = tips.filter((t) => !t.distributed);
      await tipDistributionService.distributeBulkTips(pendingTips.map((t) => t.id));
      await loadData();
      toast({
        title: 'Success',
        description: `Distributed ${pendingTips.length} tips`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to distribute tips',
        variant: 'destructive',
      });
    }
  };

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-strong p-4 rounded-xl shadow-elevated hover-lift">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Tips</span>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currencyService.formatAmount(summary?.totalTips || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="glass-strong p-4 rounded-xl shadow-elevated hover-lift">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Distributed</span>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currencyService.formatAmount(summary?.totalDistributed || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary?.distributedCount || 0} tips</p>
        </div>

        <div className="glass-strong p-4 rounded-xl shadow-elevated hover-lift">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
            <Coins className="text-orange-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currencyService.formatAmount(summary?.totalPending || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary?.pendingCount || 0} tips</p>
        </div>

        <div className="glass-strong p-4 rounded-xl shadow-elevated hover-lift">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Staff</span>
            <Users className="text-purple-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {staff.filter((s) => s.active).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active members</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tips by Source */}
        <div className="glass-strong p-6 rounded-2xl shadow-elevated">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <PieChart size={20} className="mr-2 text-orange-500" />
            Tips by Source
          </h3>
          {summary?.bySource && (
            <AnimatedDonutChart
              data={[
                { label: 'Cash', value: summary.bySource.cash, color: '#10b981' },
                { label: 'Card', value: summary.bySource.card, color: '#3b82f6' },
                { label: 'Digital', value: summary.bySource.digital, color: '#8b5cf6' },
              ]}
              size={200}
            />
          )}
        </div>

        {/* Top Earners */}
        <div className="glass-strong p-6 rounded-2xl shadow-elevated">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            Top Earners
          </h3>
          {earnings.length > 0 && (
            <AnimatedBarChart
              data={earnings.slice(0, 5).map((e) => ({
                label: e.staffName,
                value: e.totalEarnings,
                color: '#ff7043',
              }))}
              height={200}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="primary"
          className="h-16 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          onClick={() => setShowAddTipModal(true)}
        >
          <Plus size={20} className="mr-2" />
          Add Tip
        </Button>

        <Button
          variant="secondary"
          className="h-16"
          onClick={handleDistributeAll}
          disabled={summary?.pendingCount === 0}
        >
          <DollarSign size={20} className="mr-2" />
          Distribute All ({summary?.pendingCount || 0})
        </Button>
      </div>
    </div>
  );

  // Staff Tab
  const renderStaff = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Staff Members</h2>
        <Button
          variant="primary"
          onClick={() => setShowAddStaffModal(true)}
        >
          <UserPlus size={18} className="mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((member) => {
          const memberEarnings = earnings.find((e) => e.staffId === member.id);
          return (
            <div
              key={member.id}
              className="glass-strong p-4 rounded-xl shadow-elevated hover-lift"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {member.role}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    member.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  )}
                >
                  {member.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Share:</span>
                  <span className="font-medium">{member.sharePercentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Earned:</span>
                  <span className="font-bold text-green-600">
                    {currencyService.formatAmount(memberEarnings?.totalEarnings || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tips Received:</span>
                  <span className="font-medium">{memberEarnings?.tipCount || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Tips Tab
  const renderTips = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Recent Tips</h2>
        <Button variant="primary" onClick={() => setShowAddTipModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Tip
        </Button>
      </div>

      <div className="space-y-3">
        {tips.slice(0, 20).map((tip) => (
          <div
            key={tip.id}
            className="glass-strong p-4 rounded-xl shadow-soft hover-lift flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currencyService.formatAmount(tip.amount)}
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    tip.source === 'cash'
                      ? 'bg-green-100 text-green-800'
                      : tip.source === 'card'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  )}
                >
                  {tip.source}
                </span>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    tip.distributed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  )}
                >
                  {tip.distributed ? 'Distributed' : 'Pending'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(tip.date).toLocaleString()}
              </p>
            </div>

            {!tip.distributed && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDistributeTip(tip.id)}
              >
                Distribute
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 pb-6">
      {/* Modals */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onAdd={handleAddStaff}
      />
      <AddTipModal
        isOpen={showAddTipModal}
        onClose={() => setShowAddTipModal(false)}
        onAdd={handleAddTip}
      />

      {/* Header */}
      <div className="mb-6 glass-strong p-5 rounded-2xl shadow-elevated">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Coins size={28} className="mr-3 text-orange-500" />
          Tip Distribution
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage and distribute tips among staff
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['overview', 'staff', 'tips', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
              activeTab === tab
                ? 'bg-orange-500 text-white shadow-elevated'
                : 'glass text-gray-700 dark:text-gray-300 hover:bg-white/60'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'staff' && renderStaff()}
          {activeTab === 'tips' && renderTips()}
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Reports coming soon...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TipDistribution;
