// Comprehensive Staff Management Service
import { localStorageService } from './localStorage';

export interface StaffMember {
  id: string;
  name: string;
  contact: string;
  address: string;
  nationalId?: string;
  passportNumber?: string;
  emergencyContact: string;
  emergencyPhone: string;
  salary: number;
  salaryType: 'daily' | 'weekly' | 'monthly';
  role: 'chef' | 'waiter' | 'cashier' | 'helper' | 'manager' | 'supervisor' | 'cleaner';
  sharePercentage: number; // For tip distribution
  active: boolean;
  createdAt: string;
  hireDate: string;
  // Advance loan tracking
  advanceLoans: AdvanceLoan[];
  // Attendance tracking
  attendance: AttendanceRecord[];
  // Schedule information
  schedule: StaffSchedule;
}

export interface AdvanceLoan {
  id: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'repaid';
  approvedBy?: string;
  repaidDate?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

export interface StaffSchedule {
  id: string;
  workDays: string[]; // ['monday', 'tuesday', etc.]
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
}

export interface StaffReport {
  staffId: string;
  staffName: string;
  totalTips: number;
  totalSalary: number;
  totalAdvances: number;
  netEarnings: number;
  attendanceRate: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
}

export class StaffManagementService {
  private readonly STAFF_KEY = 'comprehensive_staff_members';
  private readonly LOANS_KEY = 'staff_advance_loans';
  private readonly ATTENDANCE_KEY = 'staff_attendance_records';
  private readonly SCHEDULE_KEY = 'staff_schedules';

  // ===== STAFF MANAGEMENT =====

  async getStaffMembers(): Promise<StaffMember[]> {
    try {
      const data = localStorage.getItem(this.STAFF_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading staff members:', error);
      return [];
    }
  }

  async addStaffMember(staff: Omit<StaffMember, 'id' | 'createdAt' | 'advanceLoans' | 'attendance'>): Promise<StaffMember> {
    const newStaff: StaffMember = {
      ...staff,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      advanceLoans: [],
      attendance: [],
    };

    const staffList = await this.getStaffMembers();
    staffList.push(newStaff);
    localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));

    return newStaff;
  }

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<void> {
    const staffList = await this.getStaffMembers();
    const index = staffList.findIndex((s) => s.id === id);

    if (index !== -1) {
      staffList[index] = { ...staffList[index], ...updates };
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
    }
  }

  async deleteStaffMember(id: string): Promise<void> {
    const staffList = await this.getStaffMembers();
    const filtered = staffList.filter((s) => s.id !== id);
    localStorage.setItem(this.STAFF_KEY, JSON.stringify(filtered));
  }

  async getActiveStaff(): Promise<StaffMember[]> {
    const staff = await this.getStaffMembers();
    return staff.filter((s) => s.active);
  }

  async getStaffByRole(role: StaffMember['role']): Promise<StaffMember[]> {
    const staff = await this.getStaffMembers();
    return staff.filter((s) => s.role === role && s.active);
  }

  // ===== ADVANCE LOAN MANAGEMENT =====

  async addAdvanceLoan(staffId: string, loan: Omit<AdvanceLoan, 'id' | 'date' | 'status'>): Promise<AdvanceLoan> {
    const newLoan: AdvanceLoan = {
      ...loan,
      id: this.generateId(),
      date: new Date().toISOString(),
      status: 'pending',
    };

    const staffList = await this.getStaffMembers();
    const staffIndex = staffList.findIndex((s) => s.id === staffId);

    if (staffIndex !== -1) {
      staffList[staffIndex].advanceLoans.push(newLoan);
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
    }

    return newLoan;
  }

  async approveAdvanceLoan(staffId: string, loanId: string, approvedBy: string): Promise<void> {
    const staffList = await this.getStaffMembers();
    const staffIndex = staffList.findIndex((s) => s.id === staffId);

    if (staffIndex !== -1) {
      const loanIndex = staffList[staffIndex].advanceLoans.findIndex((l) => l.id === loanId);
      if (loanIndex !== -1) {
        staffList[staffIndex].advanceLoans[loanIndex].status = 'approved';
        staffList[staffIndex].advanceLoans[loanIndex].approvedBy = approvedBy;
        localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
      }
    }
  }

  async repayAdvanceLoan(staffId: string, loanId: string): Promise<void> {
    const staffList = await this.getStaffMembers();
    const staffIndex = staffList.findIndex((s) => s.id === staffId);

    if (staffIndex !== -1) {
      const loanIndex = staffList[staffIndex].advanceLoans.findIndex((l) => l.id === loanId);
      if (loanIndex !== -1) {
        staffList[staffIndex].advanceLoans[loanIndex].status = 'repaid';
        staffList[staffIndex].advanceLoans[loanIndex].repaidDate = new Date().toISOString();
        localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
      }
    }
  }

  async getPendingLoans(): Promise<{ staff: StaffMember; loan: AdvanceLoan }[]> {
    const staff = await this.getStaffMembers();
    const pendingLoans: { staff: StaffMember; loan: AdvanceLoan }[] = [];

    staff.forEach((s) => {
      s.advanceLoans.forEach((loan) => {
        if (loan.status === 'pending') {
          pendingLoans.push({ staff: s, loan });
        }
      });
    });

    return pendingLoans;
  }

  // ===== ATTENDANCE MANAGEMENT =====

  async markAttendance(staffId: string, record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const newRecord: AttendanceRecord = {
      ...record,
      id: this.generateId(),
      hoursWorked: record.checkIn && record.checkOut
        ? this.calculateHoursWorked(record.checkIn, record.checkOut)
        : 0,
    };

    const staffList = await this.getStaffMembers();
    const staffIndex = staffList.findIndex((s) => s.id === staffId);

    if (staffIndex !== -1) {
      // Check if attendance already exists for this date
      const existingIndex = staffList[staffIndex].attendance.findIndex(
        (a) => a.date === record.date
      );

      if (existingIndex !== -1) {
        // Update existing record
        staffList[staffIndex].attendance[existingIndex] = {
          ...staffList[staffIndex].attendance[existingIndex],
          ...record,
          hoursWorked: record.checkIn && record.checkOut
            ? this.calculateHoursWorked(record.checkIn, record.checkOut)
            : staffList[staffIndex].attendance[existingIndex].hoursWorked,
        };
      } else {
        // Add new record
        staffList[staffIndex].attendance.push(newRecord);
      }

      localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
    }

    return newRecord;
  }

  private calculateHoursWorked(checkIn: string, checkOut: string): number {
    const checkInTime = new Date(`1970-01-01T${checkIn}:00`);
    const checkOutTime = new Date(`1970-01-01T${checkOut}:00`);

    if (checkOutTime < checkInTime) {
      // Handle overnight shifts
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }

  async getAttendanceReport(staffId?: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    const staff = await this.getStaffMembers();
    let allAttendance: AttendanceRecord[] = [];

    staff.forEach((s) => {
      if (!staffId || s.id === staffId) {
        allAttendance = allAttendance.concat(s.attendance);
      }
    });

    // Filter by date range if provided
    if (startDate || endDate) {
      allAttendance = allAttendance.filter((record) => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });
    }

    return allAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getStaffAttendanceStats(staffId: string, startDate?: string, endDate?: string): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    averageHoursPerDay: number;
  }> {
    const attendance = await this.getAttendanceReport(staffId, startDate, endDate);

    const stats = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      lateDays: attendance.filter(a => a.status === 'late').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
      averageHoursPerDay: 0,
    };

    stats.averageHoursPerDay = stats.totalDays > 0 ? stats.totalHours / stats.totalDays : 0;

    return stats;
  }

  // ===== SCHEDULE MANAGEMENT =====

  async setStaffSchedule(staffId: string, schedule: Omit<StaffSchedule, 'id'>): Promise<StaffSchedule> {
    const newSchedule: StaffSchedule = {
      ...schedule,
      id: this.generateId(),
    };

    const staffList = await this.getStaffMembers();
    const staffIndex = staffList.findIndex((s) => s.id === staffId);

    if (staffIndex !== -1) {
      staffList[staffIndex].schedule = newSchedule;
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
    }

    return newSchedule;
  }

  async getStaffSchedule(staffId: string): Promise<StaffSchedule | null> {
    const staff = await this.getStaffMembers();
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember ? staffMember.schedule : null;
  }

  // ===== REPORTS =====

  async getStaffReports(startDate?: string, endDate?: string): Promise<StaffReport[]> {
    const staff = await this.getStaffMembers();
    const reports: StaffReport[] = [];

    for (const member of staff) {
      // Get tip earnings (from tip distribution service)
      const tipEarnings = await this.getStaffTipEarnings(member.id, startDate, endDate);

      // Calculate salary for the period
      const salaryForPeriod = this.calculateSalaryForPeriod(member, startDate, endDate);

      // Get advance loans for the period
      const advancesForPeriod = this.getAdvancesForPeriod(member.advanceLoans, startDate, endDate);

      // Get attendance stats
      const attendanceStats = await this.getStaffAttendanceStats(member.id, startDate, endDate);

      // Calculate net earnings
      const netEarnings = tipEarnings + salaryForPeriod - advancesForPeriod;

      reports.push({
        staffId: member.id,
        staffName: member.name,
        totalTips: tipEarnings,
        totalSalary: salaryForPeriod,
        totalAdvances: advancesForPeriod,
        netEarnings,
        attendanceRate: attendanceStats.totalDays > 0 ? (attendanceStats.presentDays / attendanceStats.totalDays) * 100 : 0,
        totalHoursWorked: attendanceStats.totalHours,
        averageHoursPerDay: attendanceStats.averageHoursPerDay,
      });
    }

    return reports.sort((a, b) => b.netEarnings - a.netEarnings);
  }

  private async getStaffTipEarnings(staffId: string, startDate?: string, endDate?: string): Promise<number> {
    // This would integrate with the tip distribution service
    // For now, return 0 as placeholder
    return 0;
  }

  private calculateSalaryForPeriod(staff: StaffMember, startDate?: string, endDate?: string): number {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    switch (staff.salaryType) {
      case 'daily':
        return staff.salary * daysDiff;
      case 'weekly':
        return staff.salary * Math.ceil(daysDiff / 7);
      case 'monthly':
        return staff.salary * Math.ceil(daysDiff / 30);
      default:
        return 0;
    }
  }

  private getAdvancesForPeriod(loans: AdvanceLoan[], startDate?: string, endDate?: string): number {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    return loans
      .filter((loan) => {
        const loanDate = new Date(loan.date);
        return loanDate >= start && loanDate <= end && loan.status === 'approved';
      })
      .reduce((sum, loan) => sum + loan.amount, 0);
  }

  // ===== UTILITIES =====

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportStaffData(): Promise<any> {
    const staff = await this.getStaffMembers();
    const attendance = await this.getAttendanceReport();
    const pendingLoans = await this.getPendingLoans();

    return {
      staff,
      attendance,
      pendingLoans,
      exportedAt: new Date().toISOString(),
      summary: {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.active).length,
        totalPendingLoans: pendingLoans.reduce((sum, item) => sum + item.loan.amount, 0),
      }
    };
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.STAFF_KEY);
    localStorage.removeItem(this.LOANS_KEY);
    localStorage.removeItem(this.ATTENDANCE_KEY);
    localStorage.removeItem(this.SCHEDULE_KEY);
  }
}

export const staffManagementService = new StaffManagementService();
export default staffManagementService;
