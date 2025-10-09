// Comprehensive Staff Management Screen
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Download,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import AttendanceManagement from '@/components/AttendanceManagement';
import {
  staffManagementService,
  StaffMember,
  AdvanceLoan,
  AttendanceRecord,
  StaffSchedule,
  StaffReport
} from '@/services/staffManagementService';
import { currencyService } from '@/services/currencyService';
import { useLanguage } from '@/hooks/useLanguage';

interface StaffManagementProps {
  onNavigate?: (screen: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'attendance' | 'reports' | 'loans'>('overview');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [pendingLoans, setPendingLoans] = useState<{ staff: StaffMember; loan: AdvanceLoan }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [, setCurrency] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // Form state for adding/editing staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    contact: '',
    address: '',
    nationalId: '',
    passportNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    salary: 0,
    salaryType: 'monthly' as 'daily' | 'weekly' | 'monthly',
    role: 'waiter' as StaffMember['role'],
    sharePercentage: 25,
    active: true,
  });

  useEffect(() => {
    loadData();
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const currency = await currencyService.getCurrency();
      setCurrency(currency);
      // Get currency symbol from a formatted amount
      const formatted = currencyService.formatAmountSimple(0);
      const symbol = formatted.replace(/[0-9,\.\s]/g, '');
      setCurrencySymbol(symbol);
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffData, reportsData, loansData] = await Promise.all([
        staffManagementService.getStaffMembers(),
        staffManagementService.getStaffReports(),
        staffManagementService.getPendingLoans(),
      ]);

      setStaff(staffData);
      setReports(reportsData);
      setPendingLoans(loansData);
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_data'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffManagementService.addStaffMember({
        ...staffForm,
        salary: Number(staffForm.salary),
        sharePercentage: Number(staffForm.sharePercentage),
        hireDate: new Date().toISOString(),
        schedule: {
          id: '',
          workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        },
      });

      await loadData();
      setShowAddStaffModal(false);
      resetStaffForm();
      toast({
        title: t('success'),
        description: t('staff_member_added'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_add_staff'),
        variant: 'destructive',
      });
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      name: '',
      contact: '',
      address: '',
      nationalId: '',
      passportNumber: '',
      emergencyContact: '',
      emergencyPhone: '',
      salary: 0,
      salaryType: 'monthly' as 'daily' | 'weekly' | 'monthly',
      role: 'waiter' as StaffMember['role'],
      sharePercentage: 25,
      active: true,
    });
  };

  const handleApproveLoan = async (staffId: string, loanId: string) => {
    try {
      await staffManagementService.approveAdvanceLoan(staffId, loanId, 'Manager');
      await loadData();
      toast({
        title: 'Success',
        description: 'Loan approved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve loan',
        variant: 'destructive',
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'loans', label: 'Loans', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
      <div className="max-w-7xl mx-auto p-4 pb-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Users size={32} className="mr-3 text-[#ff7043]" />
                Staff Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your team members, attendance, and payroll
              </p>
            </div>
            <Button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c]"
            >
              <UserPlus size={20} className="mr-2" />
              Add Staff
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/30 dark:bg-gray-800/30 rounded-xl p-1 backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-[#ff7043] shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Staff</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{staff.length}</p>
                </div>
                <Users size={32} className="text-[#ff7043]" />
              </div>
            </div>

            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Active Staff</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {staff.filter(s => s.active).length}
                  </p>
                </div>
                <CheckCircle size={32} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Loans</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {pendingLoans.length}
                  </p>
                </div>
                <AlertCircle size={32} className="text-orange-500" />
              </div>
            </div>

            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Payroll</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {currencyService.formatAmountSimple(reports.reduce((sum, r) => sum + r.totalSalary, 0))}
                  </p>
                </div>
                <CreditCard size={32} className="text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => (
                <div key={member.id} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#ff7043] to-[#ff9f43] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{member.role}</p>
                      </div>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      member.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {member.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone size={16} className="mr-2" />
                      {member.contact}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin size={16} className="mr-2" />
                      {member.address.substring(0, 30)}...
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <CreditCard size={16} className="mr-2" />
                      {currencyService.formatAmountSimple(member.salary)}/{member.salaryType}
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStaff(member)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <AttendanceManagement staff={staff} />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Staff Performance Reports</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Staff</th>
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Tips</th>
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Salary</th>
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Advances</th>
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Net Earnings</th>
                      <th className="pb-3 text-gray-600 dark:text-gray-400">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.staffId} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{report.staffName}</p>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {currencyService.formatAmountSimple(report.totalTips)}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {currencyService.formatAmountSimple(report.totalSalary)}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {currencyService.formatAmountSimple(report.totalAdvances)}
                        </td>
                        <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                          {currencyService.formatAmountSimple(report.netEarnings)}
                        </td>
                        <td className="py-3">
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium w-fit',
                            report.attendanceRate >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            report.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          )}>
                            {report.attendanceRate.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="space-y-6">
            <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Pending Loan Approvals</h2>
              {pendingLoans.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No pending loans</p>
              ) : (
                <div className="space-y-4">
                  {pendingLoans.map(({ staff, loan }) => (
                    <div key={loan.id} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{staff.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{staff.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {currencyService.formatAmountSimple(loan.amount)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(loan.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{loan.reason}</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveLoan(staff.id, loan.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        <Sheet open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
          <SheetContent className="w-full sm:w-[600px] max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Staff Member</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleAddStaff} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={staffForm.name}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, name: value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Number *
                  </label>
                  <Input
                    value={staffForm.contact}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, contact: value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                  </label>
                  <Input
                    value={staffForm.address}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, address: value }))}
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    National ID
                  </label>
                  <Input
                    value={staffForm.nationalId}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, nationalId: value }))}
                    placeholder="Enter national ID number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passport Number
                  </label>
                  <Input
                    value={staffForm.passportNumber}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, passportNumber: value }))}
                    placeholder="Enter passport number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Contact Name
                  </label>
                  <Input
                    value={staffForm.emergencyContact}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, emergencyContact: value }))}
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emergency Contact Phone
                  </label>
                  <Input
                    value={staffForm.emergencyPhone}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, emergencyPhone: value }))}
                    placeholder="Enter emergency contact phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salary ({currencySymbol}) *
                  </label>
                  <Input
                    type="number"
                    value={staffForm.salary.toString()}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, salary: Number(value) }))}
                    placeholder="Enter salary amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salary Type *
                  </label>
                  <select
                    value={staffForm.salaryType}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, salaryType: e.target.value as any }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="chef">Chef</option>
                    <option value="waiter">Waiter</option>
                    <option value="cashier">Cashier</option>
                    <option value="helper">Helper</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="cleaner">Cleaner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tip Share Percentage
                  </label>
                  <Input
                    type="number"
                    value={staffForm.sharePercentage.toString()}
                    onChange={(value) => setStaffForm(prev => ({ ...prev, sharePercentage: Number(value) }))}
                    min={0}
                    max={100}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <Switch
                  checked={staffForm.active}
                  onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, active: checked }))}
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Active Staff Member</label>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white"
                >
                  Add Staff Member
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default StaffManagement;
