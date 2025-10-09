// Salary and Commission Management Service
import { localStorageService } from './localStorage';

export interface Employee {
  id: string;
  name: string;
  role: string;
  employeeType: 'full-time' | 'part-time' | 'contract';
  salaryType: 'daily' | 'weekly' | 'monthly';
  baseSalary: number;
  commissionEnabled: boolean;
  commissionRate: number; // Percentage
  commissionType: 'per-sale' | 'percentage' | 'fixed';
  active: boolean;
  joinDate: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g., "2025-01", "Week 1", "2025-01-15"
  periodType: 'daily' | 'weekly' | 'monthly';
  baseSalary: number;
  commission: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank-transfer' | 'check';
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
}

export interface CommissionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  orderId?: string;
  amount: number;
  commissionAmount: number;
  date: string;
  type: 'per-sale' | 'percentage' | 'fixed';
  notes?: string;
}

class SalaryCommissionService {
  private readonly EMPLOYEES_KEY = 'salary_employees';
  private readonly PAYMENTS_KEY = 'salary_payments';
  private readonly COMMISSIONS_KEY = 'salary_commissions';

  // ===== EMPLOYEE MANAGEMENT =====

  async getEmployees(): Promise<Employee[]> {
    try {
      const data = localStorage.getItem(this.EMPLOYEES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading employees:', error);
      return [];
    }
  }

  async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const newEmployee: Employee = {
      ...employee,
      id: this.generateId(),
    };

    const employees = await this.getEmployees();
    employees.push(newEmployee);
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employees));

    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
    const employees = await this.getEmployees();
    const index = employees.findIndex((e) => e.id === id);

    if (index !== -1) {
      employees[index] = { ...employees[index], ...updates };
      localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employees));
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    const employees = await this.getEmployees();
    const filtered = employees.filter((e) => e.id !== id);
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(filtered));
  }

  async getActiveEmployees(): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter((e) => e.active);
  }

  // ===== SALARY PAYMENTS =====

  async getSalaryPayments(startDate?: string, endDate?: string): Promise<SalaryPayment[]> {
    try {
      const data = localStorage.getItem(this.PAYMENTS_KEY);
      let payments: SalaryPayment[] = data ? JSON.parse(data) : [];

      if (startDate || endDate) {
        payments = payments.filter((payment) => {
          const paymentDate = new Date(payment.paymentDate);
          if (startDate && paymentDate < new Date(startDate)) return false;
          if (endDate && paymentDate > new Date(endDate)) return false;
          return true;
        });
      }

      return payments;
    } catch (error) {
      console.error('Error loading salary payments:', error);
      return [];
    }
  }

  async addSalaryPayment(payment: Omit<SalaryPayment, 'id'>): Promise<SalaryPayment> {
    const newPayment: SalaryPayment = {
      ...payment,
      id: this.generateId(),
    };

    const payments = await this.getSalaryPayments();
    payments.push(newPayment);
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));

    return newPayment;
  }

  async updateSalaryPayment(id: string, updates: Partial<SalaryPayment>): Promise<void> {
    const payments = await this.getSalaryPayments();
    const index = payments.findIndex((p) => p.id === id);

    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates };
      localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
    }
  }

  async markAsPaid(id: string, paymentMethod: SalaryPayment['paymentMethod']): Promise<void> {
    await this.updateSalaryPayment(id, {
      status: 'paid',
      paymentMethod,
      paymentDate: new Date().toISOString(),
    });
  }

  // ===== COMMISSION TRACKING =====

  async getCommissions(employeeId?: string, startDate?: string, endDate?: string): Promise<CommissionRecord[]> {
    try {
      const data = localStorage.getItem(this.COMMISSIONS_KEY);
      let commissions: CommissionRecord[] = data ? JSON.parse(data) : [];

      if (employeeId) {
        commissions = commissions.filter((c) => c.employeeId === employeeId);
      }

      if (startDate || endDate) {
        commissions = commissions.filter((commission) => {
          const commissionDate = new Date(commission.date);
          if (startDate && commissionDate < new Date(startDate)) return false;
          if (endDate && commissionDate > new Date(endDate)) return false;
          return true;
        });
      }

      return commissions;
    } catch (error) {
      console.error('Error loading commissions:', error);
      return [];
    }
  }

  async addCommission(commission: Omit<CommissionRecord, 'id'>): Promise<CommissionRecord> {
    const newCommission: CommissionRecord = {
      ...commission,
      id: this.generateId(),
    };

    const commissions = await this.getCommissions();
    commissions.push(newCommission);
    localStorage.setItem(this.COMMISSIONS_KEY, JSON.stringify(commissions));

    return newCommission;
  }

  async calculateCommission(employeeId: string, saleAmount: number): Promise<number> {
    const employees = await this.getEmployees();
    const employee = employees.find((e) => e.id === employeeId);

    if (!employee || !employee.commissionEnabled) return 0;

    switch (employee.commissionType) {
      case 'percentage':
        return (saleAmount * employee.commissionRate) / 100;
      case 'fixed':
        return employee.commissionRate;
      case 'per-sale':
        return employee.commissionRate;
      default:
        return 0;
    }
  }

  // ===== SALARY CALCULATION =====

  async calculateSalary(
    employeeId: string,
    period: string,
    periodType: 'daily' | 'weekly' | 'monthly'
  ): Promise<{
    baseSalary: number;
    commission: number;
    total: number;
  }> {
    const employees = await this.getEmployees();
    const employee = employees.find((e) => e.id === employeeId);

    if (!employee) {
      return { baseSalary: 0, commission: 0, total: 0 };
    }

    const baseSalary = employee.baseSalary;

    // Calculate commission for the period
    const commissions = await this.getCommissions(employeeId);
    const periodCommissions = commissions.filter((c) => {
      // Filter by period logic here
      return c.date.startsWith(period);
    });

    const totalCommission = periodCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      baseSalary,
      commission: totalCommission,
      total: baseSalary + totalCommission,
    };
  }

  async generatePayroll(period: string, periodType: 'daily' | 'weekly' | 'monthly'): Promise<SalaryPayment[]> {
    const employees = await this.getActiveEmployees();
    const payroll: SalaryPayment[] = [];

    for (const employee of employees) {
      if (employee.salaryType !== periodType) continue;

      const { baseSalary, commission, total } = await this.calculateSalary(
        employee.id,
        period,
        periodType
      );

      const payment: Omit<SalaryPayment, 'id'> = {
        employeeId: employee.id,
        employeeName: employee.name,
        period,
        periodType,
        baseSalary,
        commission,
        bonus: 0,
        deductions: 0,
        totalAmount: total,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'cash',
        status: 'pending',
      };

      const newPayment = await this.addSalaryPayment(payment);
      payroll.push(newPayment);
    }

    return payroll;
  }

  // ===== ANALYTICS =====

  async getSalarySummary(startDate?: string, endDate?: string) {
    const payments = await this.getSalaryPayments(startDate, endDate);

    const totalPaid = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const totalPending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const totalBaseSalary = payments.reduce((sum, p) => sum + p.baseSalary, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
    const totalBonus = payments.reduce((sum, p) => sum + p.bonus, 0);
    const totalDeductions = payments.reduce((sum, p) => sum + p.deductions, 0);

    return {
      totalPaid,
      totalPending,
      totalBaseSalary,
      totalCommission,
      totalBonus,
      totalDeductions,
      paymentCount: payments.length,
      paidCount: payments.filter((p) => p.status === 'paid').length,
      pendingCount: payments.filter((p) => p.status === 'pending').length,
    };
  }

  async getEmployeeSalaryHistory(employeeId: string): Promise<SalaryPayment[]> {
    const payments = await this.getSalaryPayments();
    return payments.filter((p) => p.employeeId === employeeId);
  }

  async getTopEarners(limit: number = 10): Promise<Array<{
    employeeId: string;
    employeeName: string;
    totalEarned: number;
    paymentCount: number;
  }>> {
    const payments = await this.getSalaryPayments();
    const earningsByEmployee = new Map<string, { name: string; total: number; count: number }>();

    payments.forEach((payment) => {
      if (payment.status === 'paid') {
        const existing = earningsByEmployee.get(payment.employeeId) || {
          name: payment.employeeName,
          total: 0,
          count: 0,
        };
        existing.total += payment.totalAmount;
        existing.count += 1;
        earningsByEmployee.set(payment.employeeId, existing);
      }
    });

    return Array.from(earningsByEmployee.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        totalEarned: data.total,
        paymentCount: data.count,
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit);
  }

  // ===== UTILITIES =====

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportData(startDate?: string, endDate?: string) {
    const employees = await this.getEmployees();
    const payments = await this.getSalaryPayments(startDate, endDate);
    const commissions = await this.getCommissions(undefined, startDate, endDate);
    const summary = await this.getSalarySummary(startDate, endDate);

    return {
      employees,
      payments,
      commissions,
      summary,
      exportedAt: new Date().toISOString(),
    };
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.EMPLOYEES_KEY);
    localStorage.removeItem(this.PAYMENTS_KEY);
    localStorage.removeItem(this.COMMISSIONS_KEY);
  }
}

export const salaryCommissionService = new SalaryCommissionService();
export default salaryCommissionService;
