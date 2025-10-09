// Customer Ledger Service - Credit/Payment Tracking
import { localStorageService } from './localStorage';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  currentBalance: number; // Positive = owes money, Negative = advance payment
  paymentFrequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  dueDate?: string;
  active: boolean;
  createdAt: string;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'sale' | 'payment' | 'adjustment';
  amount: number; // Positive for sales/charges, Negative for payments
  balance: number; // Balance after this transaction
  date: string;
  orderId?: string;
  paymentMethod?: 'cash' | 'bank-transfer' | 'check' | 'upi';
  reference?: string;
  notes?: string;
}

export interface PaymentReminder {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  reminderSentAt?: string;
}

class CustomerLedgerService {
  private readonly CUSTOMERS_KEY = 'ledger_customers';
  private readonly ENTRIES_KEY = 'ledger_entries';
  private readonly REMINDERS_KEY = 'ledger_reminders';

  // ===== CUSTOMER MANAGEMENT =====

  async getCustomers(): Promise<Customer[]> {
    try {
      const data = localStorage.getItem(this.CUSTOMERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'currentBalance'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId(),
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };

    const customers = await this.getCustomers();
    customers.push(newCustomer);
    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));

    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const customers = await this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(filtered));
  }

  async getActiveCustomers(): Promise<Customer[]> {
    const customers = await this.getCustomers();
    return customers.filter((c) => c.active);
  }

  async getCustomersWithBalance(): Promise<Customer[]> {
    const customers = await this.getCustomers();
    return customers.filter((c) => c.currentBalance > 0);
  }

  // ===== LEDGER ENTRIES =====

  async getLedgerEntries(customerId?: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]> {
    try {
      const data = localStorage.getItem(this.ENTRIES_KEY);
      let entries: LedgerEntry[] = data ? JSON.parse(data) : [];

      if (customerId) {
        entries = entries.filter((e) => e.customerId === customerId);
      }

      if (startDate || endDate) {
        entries = entries.filter((entry) => {
          const entryDate = new Date(entry.date);
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          return true;
        });
      }

      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading ledger entries:', error);
      return [];
    }
  }

  async addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'balance'>): Promise<LedgerEntry> {
    // Get current balance
    const customer = (await this.getCustomers()).find((c) => c.id === entry.customerId);
    if (!customer) throw new Error('Customer not found');

    const newBalance = customer.currentBalance + entry.amount;

    const newEntry: LedgerEntry = {
      ...entry,
      id: this.generateId(),
      balance: newBalance,
    };

    // Save entry
    const entries = await this.getLedgerEntries();
    entries.push(newEntry);
    localStorage.setItem(this.ENTRIES_KEY, JSON.stringify(entries));

    // Update customer balance
    await this.updateCustomer(entry.customerId, { currentBalance: newBalance });

    return newEntry;
  }

  async recordSale(customerId: string, amount: number, orderId?: string, notes?: string): Promise<LedgerEntry> {
    const customer = (await this.getCustomers()).find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    return await this.addLedgerEntry({
      customerId,
      customerName: customer.name,
      type: 'sale',
      amount,
      date: new Date().toISOString(),
      orderId,
      notes,
    });
  }

  async recordPayment(
    customerId: string,
    amount: number,
    paymentMethod: LedgerEntry['paymentMethod'],
    reference?: string,
    notes?: string
  ): Promise<LedgerEntry> {
    const customer = (await this.getCustomers()).find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    return await this.addLedgerEntry({
      customerId,
      customerName: customer.name,
      type: 'payment',
      amount: -Math.abs(amount), // Negative for payment
      date: new Date().toISOString(),
      paymentMethod,
      reference,
      notes,
    });
  }

  async recordAdjustment(customerId: string, amount: number, notes: string): Promise<LedgerEntry> {
    const customer = (await this.getCustomers()).find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    return await this.addLedgerEntry({
      customerId,
      customerName: customer.name,
      type: 'adjustment',
      amount,
      date: new Date().toISOString(),
      notes,
    });
  }

  // ===== PAYMENT REMINDERS =====

  async getPaymentReminders(status?: PaymentReminder['status']): Promise<PaymentReminder[]> {
    try {
      const data = localStorage.getItem(this.REMINDERS_KEY);
      let reminders: PaymentReminder[] = data ? JSON.parse(data) : [];

      if (status) {
        reminders = reminders.filter((r) => r.status === status);
      }

      return reminders;
    } catch (error) {
      console.error('Error loading payment reminders:', error);
      return [];
    }
  }

  async createPaymentReminder(customerId: string, amount: number, dueDate: string): Promise<PaymentReminder> {
    const customer = (await this.getCustomers()).find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const newReminder: PaymentReminder = {
      id: this.generateId(),
      customerId,
      customerName: customer.name,
      amount,
      dueDate,
      status: 'pending',
    };

    const reminders = await this.getPaymentReminders();
    reminders.push(newReminder);
    localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));

    return newReminder;
  }

  async updateReminderStatus(id: string, status: PaymentReminder['status']): Promise<void> {
    const reminders = await this.getPaymentReminders();
    const index = reminders.findIndex((r) => r.id === id);

    if (index !== -1) {
      reminders[index].status = status;
      if (status === 'sent') {
        reminders[index].reminderSentAt = new Date().toISOString();
      }
      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
    }
  }

  async getOverdueReminders(): Promise<PaymentReminder[]> {
    const reminders = await this.getPaymentReminders();
    const today = new Date();

    return reminders.filter((r) => {
      const dueDate = new Date(r.dueDate);
      return r.status !== 'paid' && dueDate < today;
    });
  }

  // ===== ANALYTICS =====

  async getLedgerSummary(startDate?: string, endDate?: string) {
    const customers = await this.getCustomers();
    const entries = await this.getLedgerEntries(undefined, startDate, endDate);

    const totalReceivable = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalAdvance = customers.reduce((sum, c) => sum + Math.abs(Math.min(0, c.currentBalance)), 0);

    const totalSales = entries
      .filter((e) => e.type === 'sale')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPayments = entries
      .filter((e) => e.type === 'payment')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const customersWithBalance = customers.filter((c) => c.currentBalance > 0).length;

    return {
      totalReceivable,
      totalAdvance,
      totalSales,
      totalPayments,
      customersWithBalance,
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.active).length,
    };
  }

  async getCustomerStatement(customerId: string, startDate?: string, endDate?: string) {
    const customer = (await this.getCustomers()).find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const entries = await this.getLedgerEntries(customerId, startDate, endDate);

    const totalSales = entries
      .filter((e) => e.type === 'sale')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPayments = entries
      .filter((e) => e.type === 'payment')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    return {
      customer,
      entries,
      totalSales,
      totalPayments,
      currentBalance: customer.currentBalance,
      entryCount: entries.length,
    };
  }

  async getTopDebtors(limit: number = 10): Promise<Customer[]> {
    const customers = await this.getCustomers();
    return customers
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, limit);
  }

  async getPaymentHistory(customerId: string): Promise<LedgerEntry[]> {
    const entries = await this.getLedgerEntries(customerId);
    return entries.filter((e) => e.type === 'payment');
  }

  // ===== UTILITIES =====

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportData(startDate?: string, endDate?: string) {
    const customers = await this.getCustomers();
    const entries = await this.getLedgerEntries(undefined, startDate, endDate);
    const reminders = await this.getPaymentReminders();
    const summary = await this.getLedgerSummary(startDate, endDate);

    return {
      customers,
      entries,
      reminders,
      summary,
      exportedAt: new Date().toISOString(),
    };
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.CUSTOMERS_KEY);
    localStorage.removeItem(this.ENTRIES_KEY);
    localStorage.removeItem(this.REMINDERS_KEY);
  }
}

export const customerLedgerService = new CustomerLedgerService();
export default customerLedgerService;
