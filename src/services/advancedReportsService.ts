// Advanced Reports & Analytics Service
import { localStorageService, Order, InventoryItem } from './localStorage';
import { salaryCommissionService } from './salaryCommissionService';
import { customerLedgerService } from './customerLedgerService';
import { tipDistributionService } from './tipDistributionService';

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  cashSales: number;
  cardSales: number;
  digitalSales: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface ItemPerformanceReport {
  itemName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  orderCount: number;
  lastSoldDate: string;
}

export interface CategoryReport {
  category: string;
  totalSales: number;
  totalOrders: number;
  itemCount: number;
  averageOrderValue: number;
}

export interface TimeBasedReport {
  hour: number;
  orderCount: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface StaffPerformanceReport {
  staffName: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  commissionEarned: number;
  tipsEarned: number;
}

export interface StockWastageReport {
  itemName: string;
  currentStock: number;
  minimumStock: number;
  status: 'ok' | 'low' | 'out-of-stock' | 'overstocked';
  daysUntilStockout: number;
  reorderRecommended: boolean;
}

export interface CustomerFrequencyReport {
  customerId: string;
  customerName: string;
  visitCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastVisitDate: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
}

export interface ProfitLossReport {
  period: string;
  revenue: {
    sales: number;
    tips: number;
    other: number;
    total: number;
  };
  expenses: {
    salaries: number;
    inventory: number;
    rent: number;
    utilities: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

class AdvancedReportsService {
  // ===== DAILY SALES REPORT =====

  async getDailySalesReport(date: string): Promise<DailySalesReport> {
    const orders = await this.getOrdersByDate(date);

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const cashSales = orders
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.total, 0);

    const cardSales = orders
      .filter((o) => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    const digitalSales = orders
      .filter((o) => o.paymentMethod === 'digital')
      .reduce((sum, o) => sum + o.total, 0);

    const topSellingItems = await this.getTopSellingItems(orders, 10);

    return {
      date,
      totalSales,
      totalOrders,
      averageOrderValue,
      cashSales,
      cardSales,
      digitalSales,
      topSellingItems,
    };
  }

  // ===== ITEM PERFORMANCE =====

  async getMostSellingItems(limit: number = 10): Promise<ItemPerformanceReport[]> {
    const orders = await localStorageService.getOrders();
    const itemStats = new Map<string, {
      quantity: number;
      revenue: number;
      orderCount: number;
      lastSold: string;
      prices: number[];
    }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemStats.get(item.name) || {
          quantity: 0,
          revenue: 0,
          orderCount: 0,
          lastSold: order.createdAt,
          prices: [],
        };

        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.orderCount += 1;
        existing.lastSold = order.createdAt;
        existing.prices.push(item.price);

        itemStats.set(item.name, existing);
      });
    });

    return Array.from(itemStats.entries())
      .map(([itemName, stats]) => ({
        itemName,
        totalQuantitySold: stats.quantity,
        totalRevenue: stats.revenue,
        averagePrice: stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length,
        orderCount: stats.orderCount,
        lastSoldDate: stats.lastSold,
      }))
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, limit);
  }

  async getLeastSellingItems(limit: number = 10): Promise<ItemPerformanceReport[]> {
    const allItems = await this.getMostSellingItems(1000);
    return allItems
      .sort((a, b) => a.totalQuantitySold - b.totalQuantitySold)
      .slice(0, limit);
  }

  // ===== CATEGORY ANALYSIS =====

  async getRevenueByCategory(): Promise<CategoryReport[]> {
    const orders = await localStorageService.getOrders();
    const categoryStats = new Map<string, {
      sales: number;
      orders: Set<string>;
      items: Set<string>;
    }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.category || 'Uncategorized';
        const existing = categoryStats.get(category) || {
          sales: 0,
          orders: new Set<string>(),
          items: new Set<string>(),
        };

        existing.sales += item.price * item.quantity;
        existing.orders.add(order.id);
        existing.items.add(item.name);

        categoryStats.set(category, existing);
      });
    });

    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        totalSales: stats.sales,
        totalOrders: stats.orders.size,
        itemCount: stats.items.size,
        averageOrderValue: stats.sales / stats.orders.size,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  // ===== TIME-BASED ANALYSIS =====

  async getRevenueByTime(date?: string): Promise<TimeBasedReport[]> {
    const orders = date 
      ? await this.getOrdersByDate(date)
      : await localStorageService.getOrders();

    const hourlyStats = new Map<number, { orders: number; sales: number }>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyStats.set(i, { orders: 0, sales: 0 });
    }

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      const stats = hourlyStats.get(hour)!;
      stats.orders += 1;
      stats.sales += order.total;
    });

    return Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        orderCount: stats.orders,
        totalSales: stats.sales,
        averageOrderValue: stats.orders > 0 ? stats.sales / stats.orders : 0,
      }))
      .filter((h) => h.orderCount > 0);
  }

  // ===== STAFF PERFORMANCE =====

  async getStaffPerformance(startDate?: string, endDate?: string): Promise<StaffPerformanceReport[]> {
    const orders = await this.getOrdersByDateRange(startDate, endDate);
    const staffStats = new Map<string, { sales: number; orders: number }>();

    orders.forEach((order) => {
      if (order.servedBy) {
        const existing = staffStats.get(order.servedBy) || { sales: 0, orders: 0 };
        existing.sales += order.total;
        existing.orders += 1;
        staffStats.set(order.servedBy, existing);
      }
    });

    // Get commission and tips data
    const commissions = await salaryCommissionService.getCommissions(undefined, startDate, endDate);
    const tipEarnings = await tipDistributionService.getAllStaffEarnings(startDate, endDate);

    return Array.from(staffStats.entries())
      .map(([staffName, stats]) => {
        const staffCommissions = commissions
          .filter((c) => c.employeeName === staffName)
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const staffTips = tipEarnings.find((e) => e.staffName === staffName)?.totalEarnings || 0;

        return {
          staffName,
          totalSales: stats.sales,
          orderCount: stats.orders,
          averageOrderValue: stats.sales / stats.orders,
          commissionEarned: staffCommissions,
          tipsEarned: staffTips,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  // ===== STOCK & WASTAGE =====

  async getStockWastageReport(): Promise<StockWastageReport[]> {
    const inventory = await localStorageService.getInventoryItems();
    const orders = await localStorageService.getOrders();

    // Calculate daily usage rate
    const usageRates = new Map<string, number>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = usageRates.get(item.name) || 0;
        usageRates.set(item.name, current + item.quantity);
      });
    });

    const daysOfData = 30; // Assume 30 days of data

    return inventory.map((item: InventoryItem) => {
      const dailyUsage = (usageRates.get(item.name) || 0) / daysOfData;
      const daysUntilStockout = dailyUsage > 0 ? item.stock / dailyUsage : 999;
      
      let status: StockWastageReport['status'] = 'ok';
      if (item.stock === 0) status = 'out-of-stock';
      else if (item.stock < item.minStock) status = 'low';
      else if (item.stock > item.minStock * 5) status = 'overstocked';

      return {
        itemName: item.name,
        currentStock: item.stock,
        minimumStock: item.minStock,
        status,
        daysUntilStockout: Math.round(daysUntilStockout),
        reorderRecommended: item.stock < item.minStock * 1.5,
      };
    });
  }

  // ===== CUSTOMER FREQUENCY =====

  async getCustomerVisitFrequency(): Promise<CustomerFrequencyReport[]> {
    const customers = await customerLedgerService.getCustomers();
    const orders = await localStorageService.getOrders();

    return customers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerName === customer.name);
      const visitCount = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue = visitCount > 0 ? totalSpent / visitCount : 0;
      
      const lastVisit = customerOrders.length > 0 
        ? customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : customer.createdAt;

      // Determine frequency
      let frequency: CustomerFrequencyReport['frequency'] = 'occasional';
      if (visitCount > 20) frequency = 'daily';
      else if (visitCount > 8) frequency = 'weekly';
      else if (visitCount > 2) frequency = 'monthly';

      return {
        customerId: customer.id,
        customerName: customer.name,
        visitCount,
        totalSpent,
        averageOrderValue,
        lastVisitDate: lastVisit,
        frequency,
      };
    }).sort((a, b) => b.visitCount - a.visitCount);
  }

  // ===== PROFIT & LOSS =====

  async getProfitLossReport(startDate?: string, endDate?: string): Promise<ProfitLossReport> {
    const orders = await this.getOrdersByDateRange(startDate, endDate);
    const expenses = await localStorageService.getExpenses();
    const salaryPayments = await salaryCommissionService.getSalaryPayments(startDate, endDate);
    const tips = await tipDistributionService.getTipSummary(startDate, endDate);

    // Revenue
    const salesRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const tipsRevenue = tips.totalTips;

    // Expenses
    const salaryExpenses = salaryPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const otherExpenses = expenses
      .filter((e) => {
        if (startDate && new Date(e.date) < new Date(startDate)) return false;
        if (endDate && new Date(e.date) > new Date(endDate)) return false;
        return true;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const totalRevenue = salesRevenue + tipsRevenue;
    const totalExpenses = salaryExpenses + otherExpenses;
    const grossProfit = salesRevenue;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: `${startDate || 'All'} to ${endDate || 'Now'}`,
      revenue: {
        sales: salesRevenue,
        tips: tipsRevenue,
        other: 0,
        total: totalRevenue,
      },
      expenses: {
        salaries: salaryExpenses,
        inventory: 0,
        rent: 0,
        utilities: 0,
        other: otherExpenses,
        total: totalExpenses,
      },
      grossProfit,
      netProfit,
      profitMargin,
    };
  }

  // ===== HELPER METHODS =====

  private async getOrdersByDate(date: string): Promise<Order[]> {
    const orders = await localStorageService.getOrders();
    return orders.filter((order) => order.createdAt.startsWith(date));
  }

  private async getOrdersByDateRange(startDate?: string, endDate?: string): Promise<Order[]> {
    const orders = await localStorageService.getOrders();
    
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (startDate && orderDate < new Date(startDate)) return false;
      if (endDate && orderDate > new Date(endDate)) return false;
      return true;
    });
  }

  private async getTopSellingItems(orders: Order[], limit: number) {
    const itemStats = new Map<string, { quantity: number; revenue: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemStats.get(item.name) || { quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        itemStats.set(item.name, existing);
      });
    });

    return Array.from(itemStats.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  // ===== EXPORT =====

  async exportAllReports(startDate?: string, endDate?: string) {
    const [
      dailySales,
      mostSelling,
      leastSelling,
      categoryReport,
      timeReport,
      staffPerformance,
      stockWastage,
      customerFrequency,
      profitLoss,
    ] = await Promise.all([
      this.getDailySalesReport(new Date().toISOString().split('T')[0]),
      this.getMostSellingItems(),
      this.getLeastSellingItems(),
      this.getRevenueByCategory(),
      this.getRevenueByTime(),
      this.getStaffPerformance(startDate, endDate),
      this.getStockWastageReport(),
      this.getCustomerVisitFrequency(),
      this.getProfitLossReport(startDate, endDate),
    ]);

    return {
      dailySales,
      mostSelling,
      leastSelling,
      categoryReport,
      timeReport,
      staffPerformance,
      stockWastage,
      customerFrequency,
      profitLoss,
      exportedAt: new Date().toISOString(),
    };
  }
}

export const advancedReportsService = new AdvancedReportsService();
export default advancedReportsService;
