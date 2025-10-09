// src/services/analyticsService.ts
// Advanced analytics service for sales forecasting, customer behavior, and profit analysis

import { localStorageService, type Order, type InventoryItem, type Customer } from './localStorage';

export interface SalesData {
  date: string;
  total: number;
  orders: number;
  averageOrderValue: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageSpendPerCustomer: number;
  topCustomers: Customer[];
  customerRetentionRate: number;
}

export interface ProfitAnalytics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  profitByCategory: Record<string, { revenue: number; cost: number; profit: number; margin: number }>;
  topProfitItems: Array<{ name: string; profit: number; margin: number }>;
}

export interface PeakHoursData {
  hour: number;
  orders: number;
  revenue: number;
  averageOrderValue: number;
}

export interface SalesForecast {
  date: string;
  predictedOrders: number;
  predictedRevenue: number;
  confidence: number;
}

export interface AnalyticsSummary {
  sales: SalesData[];
  customers: CustomerAnalytics;
  profits: ProfitAnalytics;
  peakHours: PeakHoursData[];
  forecasts: SalesForecast[];
  period: 'daily' | 'weekly' | 'monthly';
}

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Sales Analytics
  async getSalesAnalytics(days: number = 30): Promise<SalesData[]> {
    const orders = await localStorageService.getOrders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const salesByDate: Record<string, { total: number; orders: number }> = {};

    orders
      .filter(order => new Date(order.date) >= cutoffDate)
      .forEach(order => {
        const dateKey = order.date;
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { total: 0, orders: 0 };
        }
        salesByDate[dateKey].total += order.total;
        salesByDate[dateKey].orders += 1;
      });

    return Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        total: data.total,
        orders: data.orders,
        averageOrderValue: data.total / data.orders,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Customer Analytics
  async getCustomerAnalytics(days: number = 30): Promise<CustomerAnalytics> {
    const orders = await localStorageService.getOrders();
    const customers = await localStorageService.getCustomers();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Analyze orders for customer behavior
    const customerOrders = new Map<string, Order[]>();
    orders
      .filter(order => new Date(order.date) >= cutoffDate)
      .forEach(order => {
        if (order.customerName) {
          const customerKey = order.customerName.toLowerCase();
          if (!customerOrders.has(customerKey)) {
            customerOrders.set(customerKey, []);
          }
          customerOrders.get(customerKey)!.push(order);
        }
      });

    const totalCustomers = customers.length;
    let newCustomers = 0;
    let returningCustomers = 0;
    let totalSpend = 0;

    customerOrders.forEach((orders, customerKey) => {
      const customer = customers.find(c => c.name.toLowerCase() === customerKey);
      if (customer) {
        if (orders.length > 1) {
          returningCustomers++;
        } else {
          newCustomers++;
        }
        totalSpend += orders.reduce((sum, order) => sum + order.total, 0);
      }
    });

    const averageSpendPerCustomer = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

    // Calculate retention rate (simplified)
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Get top customers by spend
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageSpendPerCustomer,
      topCustomers,
      customerRetentionRate,
    };
  }

  // Profit Analytics
  async getProfitAnalytics(): Promise<ProfitAnalytics> {
    const orders = await localStorageService.getOrders();
    const inventory = await localStorageService.getInventoryItems();

    let totalRevenue = 0;
    let totalCost = 0;
    const categoryData: Record<string, { revenue: number; cost: number }> = {};

    // Calculate revenue and cost by category
    orders.forEach(order => {
      totalRevenue += order.total;

      order.items.forEach(orderItem => {
        // Find inventory item to get cost
        const inventoryItem = inventory.find(item =>
          item.name.toLowerCase() === orderItem.name.toLowerCase()
        );

        if (inventoryItem) {
          const itemCost = inventoryItem.costPrice * orderItem.quantity;
          totalCost += itemCost;

          // Track by category (assuming menu items have categories)
          const category = 'general'; // This would come from menu item categories in a real app
          if (!categoryData[category]) {
            categoryData[category] = { revenue: 0, cost: 0 };
          }
          categoryData[category].revenue += orderItem.price * orderItem.quantity;
          categoryData[category].cost += itemCost;
        }
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate profit by category
    const profitByCategory: Record<string, { revenue: number; cost: number; profit: number; margin: number }> = {};
    Object.entries(categoryData).forEach(([category, data]) => {
      const profit = data.revenue - data.cost;
      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
      profitByCategory[category] = {
        revenue: data.revenue,
        cost: data.cost,
        profit,
        margin,
      };
    });

    // Calculate profit by individual items
    const itemProfits: Array<{ name: string; profit: number; margin: number }> = [];
    orders.forEach(order => {
      order.items.forEach(orderItem => {
        const inventoryItem = inventory.find(item =>
          item.name.toLowerCase() === orderItem.name.toLowerCase()
        );

        if (inventoryItem) {
          const revenue = orderItem.price * orderItem.quantity;
          const cost = inventoryItem.costPrice * orderItem.quantity;
          const profit = revenue - cost;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

          itemProfits.push({
            name: orderItem.name,
            profit,
            margin,
          });
        }
      });
    });

    const topProfitItems = itemProfits
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      profitByCategory,
      topProfitItems,
    };
  }

  // Peak Hours Analysis
  async getPeakHours(days: number = 30): Promise<PeakHoursData[]> {
    const orders = await localStorageService.getOrders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const hourlyData: Record<number, { orders: number; revenue: number }> = {};

    orders
      .filter(order => new Date(order.date) >= cutoffDate)
      .forEach(order => {
        const hour = new Date(order.date).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { orders: 0, revenue: 0 };
        }
        hourlyData[hour].orders += 1;
        hourlyData[hour].revenue += order.total;
      });

    return Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyData[hour] || { orders: 0, revenue: 0 };
      return {
        hour,
        orders: data.orders,
        revenue: data.revenue,
        averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      };
    }).sort((a, b) => b.orders - a.orders);
  }

  // Sales Forecasting (Simple moving average with trend analysis)
  async getSalesForecast(days: number = 7): Promise<SalesForecast[]> {
    const salesData = await this.getSalesAnalytics(30); // Get last 30 days for forecasting

    if (salesData.length < 7) {
      return [];
    }

    const forecast: SalesForecast[] = [];
    const today = new Date();

    // Simple moving average forecasting
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);

      // Use last 7 days average as prediction
      const last7Days = salesData.slice(-7);
      const avgOrders = last7Days.reduce((sum, day) => sum + day.orders, 0) / last7Days.length;
      const avgRevenue = last7Days.reduce((sum, day) => sum + day.total, 0) / last7Days.length;

      // Calculate confidence based on data consistency
      const orderVariance = this.calculateVariance(last7Days.map(d => d.orders));
      const revenueVariance = this.calculateVariance(last7Days.map(d => d.total));
      const avgVariance = (orderVariance + revenueVariance) / 2;
      const confidence = Math.max(0, Math.min(100, 100 - (avgVariance / 100)));

      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedOrders: Math.round(avgOrders),
        predictedRevenue: Math.round(avgRevenue),
        confidence: Math.round(confidence),
      });
    }

    return forecast;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Get comprehensive analytics summary
  async getAnalyticsSummary(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AnalyticsSummary> {
    const days = period === 'daily' ? 30 : period === 'weekly' ? 90 : 365;

    const [sales, customers, profits, peakHours, forecasts] = await Promise.all([
      this.getSalesAnalytics(days),
      this.getCustomerAnalytics(days),
      this.getProfitAnalytics(),
      this.getPeakHours(days),
      this.getSalesForecast(7),
    ]);

    return {
      sales,
      customers,
      profits,
      peakHours,
      forecasts,
      period,
    };
  }

  // Export analytics data
  async exportAnalytics(format: 'csv' | 'json' = 'json'): Promise<string> {
    const summary = await this.getAnalyticsSummary();

    if (format === 'json') {
      return JSON.stringify(summary, null, 2);
    }

    // CSV export (simplified)
    let csv = 'Category,Metric,Value\n';

    // Sales data
    csv += 'Sales,Total Revenue,' + summary.profits.totalRevenue + '\n';
    csv += 'Sales,Total Orders,' + summary.sales.reduce((sum, day) => sum + day.orders, 0) + '\n';
    csv += 'Sales,Average Order Value,' + (summary.sales.length > 0 ?
      summary.sales.reduce((sum, day) => sum + day.averageOrderValue, 0) / summary.sales.length : 0) + '\n';

    // Customer data
    csv += 'Customers,Total Customers,' + summary.customers.totalCustomers + '\n';
    csv += 'Customers,New Customers,' + summary.customers.newCustomers + '\n';
    csv += 'Customers,Returning Customers,' + summary.customers.returningCustomers + '\n';

    // Profit data
    csv += 'Profits,Total Profit,' + summary.profits.totalProfit + '\n';
    csv += 'Profits,Profit Margin,' + summary.profits.profitMargin + '\n';

    return csv;
  }
}

export const analyticsService = AnalyticsService.getInstance();
