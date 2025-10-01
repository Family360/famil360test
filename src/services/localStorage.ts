// src/services/localStorage.ts
const STORAGE_KEYS = {
  USER_PROFILE: 'food_stall_user_profile',
  SECURITY_DATA: 'food_stall_security_data',
  MENU_ITEMS: 'food_stall_menu_items',
  ORDERS: 'food_stall_orders',
  INVENTORY: 'food_stall_inventory',
  EXPENSES: 'food_stall_expenses',
  CUSTOMERS: 'food_stall_customers',
  SETTINGS: 'food_stall_settings',
  CASH_BALANCE: 'food_stall_cash_balance'
};

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  stock: number; // Added to fix errors in NewSale.tsx
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  customerName?: string;
  notes?: string;
  createdAt: string;
  date: string; // Added to fix errors in NewSale.tsx and Reports.tsx
  tokenDisplay?: string;
  tokenNumber?: number;
  status?: 'pending' | 'preparing' | 'completed' | 'cancelled';
  // NEW FIELDS ADDED:
  customerNote?: string;
  preparationTime?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockAlert: number;
  costPrice: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface CashBalance {
  openingBalance: number;
  closingBalance: number;
  cashInHand: number;
  lastUpdated: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  stallName?: string;
  createdAt: string;
}

export interface Settings {
  currency: string;
  language: string;
  country: string;
  theme?: string;
  notifications?: boolean;
}

class LocalStorageService {
  // Generic safe setter
  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Generic safe getter
  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item || item === 'undefined') return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // User Profile
  saveUserProfile(profile: UserProfile): void {
    this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  getUserProfile(): UserProfile | null {
    return this.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  // Security Data
  saveSecurityData(securityData: any): void {
    this.setItem(STORAGE_KEYS.SECURITY_DATA, securityData);
  }

  getSecurityData(): any {
    return this.getItem(STORAGE_KEYS.SECURITY_DATA);
  }

  // Menu Items
  saveMenuItem(item: MenuItem): void {
    const items = this.getMenuItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    this.setItem(STORAGE_KEYS.MENU_ITEMS, items);
  }

  addMenuItem(item: MenuItem): void {
    this.saveMenuItem(item);
  }

  getMenuItems(): MenuItem[] {
    return this.getItem<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS) || [];
  }

  deleteMenuItem(id: string): void {
    const items = this.getMenuItems().filter(item => item.id !== id);
    this.setItem(STORAGE_KEYS.MENU_ITEMS, items);
  }

  // Orders
  saveOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  addOrder(order: Order): void {
    this.saveOrder(order);
  }

  getOrders(): Order[] {
    return this.getItem<Order[]>(STORAGE_KEYS.ORDERS) || [];
  }

  getTodayOrders(): Order[] {
    const today = new Date().toDateString();
    return this.getOrders().filter(order =>
      new Date(order.createdAt).toDateString() === today
    );
  }

  getTodaySales(): number {
    return this.getTodayOrders().reduce((total, order) => total + order.total, 0);
  }

  // Inventory
  saveInventoryItem(item: InventoryItem): void {
    const items = this.getInventoryItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    this.setItem(STORAGE_KEYS.INVENTORY, items);
  }

  getInventoryItems(): InventoryItem[] {
    return this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY) || [];
  }

  getLowStockItems(): InventoryItem[] {
    return this.getInventoryItems().filter(item => item.quantity <= item.lowStockAlert);
  }

  deleteInventoryItem(id: string): void {
    const items = this.getInventoryItems().filter(item => item.id !== id);
    this.setItem(STORAGE_KEYS.INVENTORY, items);
  }

  // Expenses
  saveExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  getExpenses(): Expense[] {
    return this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES) || [];
  }

  getTodayExpenses(): number {
    const today = new Date().toDateString();
    return this.getExpenses()
      .filter(expense => new Date(expense.date).toDateString() === today)
      .reduce((total, expense) => total + expense.amount, 0);
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(expense => expense.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  // Customers
  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS) || [];
  }

  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter(customer => customer.id !== id);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Settings
  saveSettings(settings: Settings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  getSettings(): Settings {
    return this.getItem<Settings>(STORAGE_KEYS.SETTINGS) || {
      currency: '₹',
      language: 'en',
      country: 'India',
      theme: 'light',
      notifications: true,
    };
  }

  // Cash Balance
  saveCashBalance(balance: CashBalance): void {
    this.setItem(STORAGE_KEYS.CASH_BALANCE, balance);
  }

  getCashBalance(): CashBalance | null {
    return this.getItem<CashBalance>(STORAGE_KEYS.CASH_BALANCE);
  }

  // Reports & analytics
  getTopSellingItems(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const orders = this.getOrdersByPeriod(period);
    const itemStats = new Map<string, { quantity: number; revenue: number; category: string }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        const existing = itemStats.get(key) || { quantity: 0, revenue: 0, category: 'Unknown' };
        itemStats.set(key, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
          category: existing.category,
        });
      });
    });

    return Array.from(itemStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  getOrdersByPeriod(period: 'daily' | 'weekly' | 'monthly'): Order[] {
    const now = new Date();
    const orders = this.getOrders();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (period) {
        case 'daily':
          return orderDate.toDateString() === now.toDateString();
        case 'weekly': {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          return orderDate >= weekStart;
        }
        case 'monthly': {
          const monthStart = new Date(now);
          monthStart.setMonth(now.getMonth() - 1);
          return orderDate >= monthStart;
        }
        default:
          return false;
      }
    });
  }

  getSalesReport(period: 'daily' | 'weekly' | 'monthly') {
    const orders = this.getOrdersByPeriod(period);
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    return {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      orders,
    };
  }

  getExpenseReport(period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    const expenses = this.getExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      switch (period) {
        case 'daily':
          return expenseDate.toDateString() === now.toDateString();
        case 'weekly': {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          return expenseDate >= weekStart;
        }
        case 'monthly': {
          const monthStart = new Date(now);
          monthStart.setMonth(now.getMonth() - 1);
          return expenseDate >= monthStart;
        }
        default:
          return false;
      }
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByType = expenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      expensesByType,
      expenses,
    };
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;