// Staff Attendance Management Component
import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Play,
  Square,
  Edit,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/ui/use-toast';
import { staffManagementService, StaffMember, AttendanceRecord } from '@/services/staffManagementService';

interface AttendanceManagementProps {
  staff: StaffMember[];
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ staff }) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const records = await staffManagementService.getAttendanceReport(undefined, selectedDate, selectedDate);
      setAttendance(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (staffId: string, status: 'present' | 'absent' | 'late') => {
    try {
      const now = new Date();
      const checkIn = status === 'present' ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` : undefined;

      await staffManagementService.markAttendance(staffId, {
        date: selectedDate,
        status,
        checkIn,
        checkOut: status === 'present' ? undefined : checkIn,
        notes: status === 'absent' ? 'Marked as absent' : undefined,
      });

      await loadAttendance();
      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async (staffId: string) => {
    try {
      const now = new Date();
      const checkIn = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      await staffManagementService.markAttendance(staffId, {
        date: selectedDate,
        status: 'present',
        checkIn,
      });

      await loadAttendance();
      toast({
        title: 'Success',
        description: 'Check-in recorded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record check-in',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      const now = new Date();
      const checkOut = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      await staffManagementService.markAttendance(staffId, {
        date: selectedDate,
        status: 'present',
        checkOut,
      });

      await loadAttendance();
      toast({
        title: 'Success',
        description: 'Check-out recorded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record check-out',
        variant: 'destructive',
      });
    }
  };

  const getAttendanceForStaff = (staffId: string) => {
    return attendance.find(a => a.date === selectedDate && a.status !== 'absent');
  };

  const getStaffAttendanceStatus = (staffId: string) => {
    const record = getAttendanceForStaff(staffId);
    if (!record) return { status: 'not-marked', checkIn: null, checkOut: null };

    return {
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Daily Attendance</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <Button
          onClick={loadAttendance}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.filter(s => s.active).map((member) => {
          const attendanceStatus = getStaffAttendanceStatus(member.id);

          return (
            <div key={member.id} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#ff7043] to-[#ff9f43] rounded-full flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{member.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  attendanceStatus.status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  attendanceStatus.status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  attendanceStatus.status === 'absent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                )}>
                  {attendanceStatus.status === 'present' ? 'Present' :
                   attendanceStatus.status === 'late' ? 'Late' :
                   attendanceStatus.status === 'absent' ? 'Absent' : 'Not Marked'}
                </div>
              </div>

              {/* Time Display */}
              {(attendanceStatus.checkIn || attendanceStatus.checkOut) && (
                <div className="mb-4 space-y-2">
                  {attendanceStatus.checkIn && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Play size={16} className="mr-2 text-green-500" />
                      Check-in: {attendanceStatus.checkIn}
                    </div>
                  )}
                  {attendanceStatus.checkOut && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Square size={16} className="mr-2 text-red-500" />
                      Check-out: {attendanceStatus.checkOut}
                    </div>
                  )}
                  {attendanceStatus.checkIn && attendanceStatus.checkOut && (
                    <div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Clock size={16} className="mr-2 text-blue-500" />
                      Hours: {(() => {
                        const checkInTime = new Date(`1970-01-01T${attendanceStatus.checkIn}:00`);
                        const checkOutTime = new Date(`1970-01-01T${attendanceStatus.checkOut}:00`);
                        if (checkOutTime < checkInTime) {
                          checkOutTime.setDate(checkOutTime.getDate() + 1);
                        }
                        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
                        return (diffMs / (1000 * 60 * 60)).toFixed(2);
                      })()}h
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {attendanceStatus.status === 'not-marked' && (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(member.id, 'present')}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(member.id, 'late')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                    >
                      <AlertTriangle size={14} className="mr-1" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(member.id, 'absent')}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs"
                    >
                      <XCircle size={14} className="mr-1" />
                      Absent
                    </Button>
                  </div>
                )}

                {attendanceStatus.status === 'present' && !attendanceStatus.checkOut && (
                  <Button
                    size="sm"
                    onClick={() => handleCheckOut(member.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square size={16} className="mr-2" />
                    Check Out
                  </Button>
                )}

                {attendanceStatus.status === 'present' && attendanceStatus.checkIn && !attendanceStatus.checkOut && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Checked in at {attendanceStatus.checkIn}
                    </p>
                  </div>
                )}

                {attendanceStatus.status !== 'not-marked' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingRecord(member.id)}
                    className="w-full"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Summary */}
      <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{attendance.filter(a => a.status === 'present').length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'late').length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{attendance.filter(a => a.status === 'absent').length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{staff.length - attendance.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Not Marked</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
