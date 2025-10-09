// src/services/localStorage.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences'; // Add import for native

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
  category?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'digital';
  customerName?: string;
  notes?: string;
  createdAt: string;
  date: string; // Added to fix errors in NewSale.tsx and Reports.tsx
  tokenDisplay?: string;
  tokenNumber?: number;
  status?: 'pending' | 'preparing' | 'completed' | 'cancelled';
  servedBy?: string;
  // NEW FIELDS ADDED:
  customerNote?: string;
  preparationTime?: number;
  orderType?: 'dine-in' | 'delivery' | 'takeaway';
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
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

// Fixed: Added profileComplete: boolean;
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  stallName?: string;
  createdAt: string;
  profileComplete: boolean; // Added to fix TS error in auth
}

export interface Settings {
  currency: string;
  language: string;
  country: string;
  theme?: string;
  notifications?: boolean;
}

class LocalStorageService {
  // Free plan limits (reduced to encourage upgrades)
  private static readonly FREE_ORDERS_PER_MONTH = 20;
  private static readonly FREE_PRODUCTS_LIMIT = 6;
  
  private currentUserId: string | null = null;

  /**
   * Set current user ID for data isolation
   * Call this after user logs in
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }
  
  /**
   * Clear current user (on logout)
   */
  clearCurrentUser(): void {
    this.currentUserId = null;
  }
  
  /**
   * Get user-specific storage key
   * Prefixes key with user ID to isolate data between users
   */
  private getUserKey(key: string): string {
    // Don't prefix global keys (settings, etc.)
    const globalKeys = [STORAGE_KEYS.SETTINGS];
    if (globalKeys.includes(key)) {
      return key;
    }
    
    // Prefix with user ID if logged in
    if (this.currentUserId) {
      return `user_${this.currentUserId}_${key}`;
    }
    
    return key; // Fallback for non-authenticated state
  }

  // -------- Free/Premium helpers --------
  private isPremium(): boolean {
    try { return (localStorage.getItem('is_premium') === 'true'); } catch { return false; }
  }

  private monthKey(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getOrderCountsByMonth(): Promise<Record<string, number>> {
    return (await this.getItem<Record<string, number>>('order_counts_by_month')) || {};
  }

  private async setOrderCountsByMonth(map: Record<string, number>): Promise<void> {
    await this.setItem('order_counts_by_month', map);
  }

  async canAddOrder(): Promise<boolean> {
    if (this.isPremium()) return true;
    const counts = await this.getOrderCountsByMonth();
    const key = this.monthKey();
    const count = counts[key] || 0;
    return count < LocalStorageService.FREE_ORDERS_PER_MONTH;
  }

  private async incrementMonthlyOrderCount(): Promise<void> {
    const counts = await this.getOrderCountsByMonth();
    const key = this.monthKey();
    counts[key] = (counts[key] || 0) + 1;
    await this.setOrderCountsByMonth(counts);
  }

  async canAddProduct(): Promise<boolean> {
    if (this.isPremium()) return true;
    const items = await this.getMenuItems();
    return items.length < LocalStorageService.FREE_PRODUCTS_LIMIT;
  }

  // Generic safe setter (hybrid: localStorage web, Preferences native)
  private async setItem<T>(key: string, data: T): Promise<void> {
    const userKey = this.getUserKey(key);
    try {
      const json = JSON.stringify(data);
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: userKey, value: json });
      } else {
        localStorage.setItem(userKey, json);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Generic safe getter (hybrid)
  private async getItem<T>(key: string): Promise<T | null> {
    const userKey = this.getUserKey(key);
    try {
      let item: string | null;
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: userKey });
        item = value;
      } else {
        item = localStorage.getItem(userKey);
      }
      if (!item || item === 'undefined') return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  // User Profile (Fixed: Added clearUserProfile; setUserProfile as alias to saveUserProfile)
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  // Alias for auth compatibility (Fixed: Added this to match useAuth calls)
  async setUserProfile(profile: UserProfile): Promise<void> {
    await this.saveUserProfile(profile);
  }

  async getUserProfile(): Promise<UserProfile | null> {
    return await this.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  // Fixed: Added clearUserProfile for logout
  async clearUserProfile(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: STORAGE_KEYS.USER_PROFILE });
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  }

  // Security Data
  async saveSecurityData(securityData: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.SECURITY_DATA, securityData);
  }

  async getSecurityData(): Promise<any> {
    return await this.getItem(STORAGE_KEYS.SECURITY_DATA);
  }

  // Menu Items
  async saveMenuItem(item: MenuItem): Promise<void> {
    const items = await this.getMenuItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    await this.setItem(STORAGE_KEYS.MENU_ITEMS, items);
  }

  async addMenuItem(item: MenuItem): Promise<void> {
    const allowed = await this.canAddProduct();
    if (!allowed) {
      throw new Error('FREE_LIMIT_REACHED_PRODUCTS');
    }
    await this.saveMenuItem(item);
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await this.getItem<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS) || [];
  }

  async deleteMenuItem(id: string): Promise<void> {
    const items = (await this.getMenuItems()).filter(item => item.id !== id);
    await this.setItem(STORAGE_KEYS.MENU_ITEMS, items);
  }

  // Orders
  async saveOrder(order: Order): Promise<void> {
    // Enforce free plan order limit
    const allowed = await this.canAddOrder();
    if (!allowed) {
      throw new Error('FREE_LIMIT_REACHED_ORDERS');
    }
    const orders = await this.getOrders();
    orders.unshift(order);
    await this.setItem(STORAGE_KEYS.ORDERS, orders);
    // Increment monthly count for free users
    if (!this.isPremium()) {
      await this.incrementMonthlyOrderCount();
    }
  }

  async addOrder(order: Order): Promise<void> {
    await this.saveOrder(order);
  }

  async getOrders(): Promise<Order[]> {
    return await this.getItem<Order[]>(STORAGE_KEYS.ORDERS) || [];
  }

  async getTodayOrders(): Promise<Order[]> {
    const today = new Date().toDateString();
    return (await this.getOrders()).filter(order =>
      new Date(order.createdAt).toDateString() === today
    );
  }

  async getTodaySales(): Promise<number> {
    return (await this.getTodayOrders()).reduce((total, order) => total + order.total, 0);
  }

  // Inventory
  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const items = await this.getInventoryItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    await this.setItem(STORAGE_KEYS.INVENTORY, items);
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return await this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY) || [];
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return (await this.getInventoryItems()).filter(item => item.stock <= item.minStock);
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const items = (await this.getInventoryItems()).filter(item => item.id !== id);
    await this.setItem(STORAGE_KEYS.INVENTORY, items);
  }

  // Expenses
  async saveExpense(expense: Expense): Promise<void> {
    const expenses = await this.getExpenses();
    expenses.unshift(expense);
    await this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  async getExpenses(): Promise<Expense[]> {
    return await this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES) || [];
  }

  async getTodayExpenses(): Promise<number> {
    const today = new Date().toDateString();
    return (await this.getExpenses())
      .filter(expense => new Date(expense.date).toDateString() === today)
      .reduce((total, expense) => total + expense.amount, 0);
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = (await this.getExpenses()).filter(expense => expense.id !== id);
    await this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  // Customers
  async saveCustomer(customer: Customer): Promise<void> {
    const customers = await this.getCustomers();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    await this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  async getCustomers(): Promise<Customer[]> {
    return await this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS) || [];
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = (await this.getCustomers()).filter(customer => customer.id !== id);
    await this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Settings
  async saveSettings(settings: Settings): Promise<void> {
    await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  async getSettings(): Promise<Settings> {
    return await this.getItem<Settings>(STORAGE_KEYS.SETTINGS) || {
      currency: '₹',
      language: 'en',
      country: 'India',
      theme: 'light',
      notifications: true,
    };
  }

  // Cash Balance
  async saveCashBalance(balance: CashBalance): Promise<void> {
    await this.setItem(STORAGE_KEYS.CASH_BALANCE, balance);
  }

  async getCashBalance(): Promise<CashBalance | null> {
    return await this.getItem<CashBalance>(STORAGE_KEYS.CASH_BALANCE);
  }

  // Reports & analytics
  async getTopSellingItems(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const orders = await this.getOrdersByPeriod(period);
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

  async getOrdersByPeriod(period: 'daily' | 'weekly' | 'monthly'): Promise<Order[]> {
    const now = new Date();
    const orders = await this.getOrders();
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

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly') {
    const orders = await this.getOrdersByPeriod(period);
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    return {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      orders,
    };
  }

  async getExpenseReport(period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    const expenses = (await this.getExpenses()).filter(expense => {
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

  async clearAllData(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        await Preferences.remove({ key });
      }
    } else {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;