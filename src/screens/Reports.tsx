// src/screens/Reports.tsx
import React, { useEffect, useState, useCallback } from "react"; // Updated import to fix JSX
import Card from "../components/Card";
import Button from "../components/Button";
import ReportsModal from "../components/ReportsModal";
import { localStorageService, InventoryItem, Order } from "../services/localStorage";
import { Download, TrendingUp, DollarSign, Package, Wallet, AlertTriangle, BarChart3, ShoppingBag, ArrowLeft } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ReportsProps {
  onNavigate: (path: string) => void;
}

const Reports = ({ onNavigate }: ReportsProps) => {
  const [todaySales, setTodaySales] = useState<number>(0);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [showReportsModal, setShowReportsModal] = useState<boolean>(false);
  const [topSellingItems, setTopSellingItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<number>(0);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);
  const [todayProfit, setTodayProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReportsData = useCallback(() => {
    const today = new Date('2025-09-01');
    const orders = localStorageService.getOrders().filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.toDateString() === today.toDateString();
    });

    const sales = orders.reduce((sum, order) => sum + order.total, 0);
    const expenses = localStorageService.getExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === today.toDateString();
    }).reduce((sum, expense) => sum + expense.amount, 0);
    const profit = sales - expenses;

    const itemsSold: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemsSold[item.menuItemId]) {
          itemsSold[item.menuItemId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemsSold[item.menuItemId].quantity += item.quantity;
        itemsSold[item.menuItemId].revenue += item.quantity * item.price;
      });
    });

    const topItems = Object.values(itemsSold)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const lowStock = localStorageService.getInventoryItems().filter(item => item.quantity <= item.lowStockAlert);

    setTodaySales(sales);
    setTodayOrders(orders);
    setTodayExpenses(expenses);
    setTodayProfit(profit);
    setTopSellingItems(topItems);
    setLowStockItems(lowStock);
    setAverageOrderValue(orders.length > 0 ? sales / orders.length : 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  return (
    <div className="px-4 py-4 pb-24 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#2A2119] dark:via-[#3D2F21] dark:to-[#4D3B2A] min-h-screen">
      <div className="mb-4">
        {/* @ts-ignore */}
        <Button
          variant="secondary"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-lg shadow-sm"
        >
          {/* @ts-ignore */}
          <ArrowLeft size={18} />
          Back to Dashboard
        </Button>
      </div>

      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          {/* @ts-ignore */}
          <Button
            onClick={() => setShowReportsModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#ff7043] to-[#ff8c38] hover:from-[#ff8c38] hover:to-[#ff7043] text-white rounded-lg shadow-md"
          >
            {/* @ts-ignore */}
            <Download size={18} />
            Download Report
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">September 01, 2025</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-[#ff7043]/10 to-[#ff8c38]/10">
              {/* @ts-ignore */}
              <DollarSign className="text-[#ff7043] h-8 w-8" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Today's Sales</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">${todaySales.toFixed(2)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-[#1e88e5]/10 to-[#42a5f5]/10">
              {/* @ts-ignore */}
              <ShoppingBag className="text-[#1e88e5] h-8 w-8" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Orders</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{todayOrders.length}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-[#43a047]/10 to-[#66bb6a]/10">
              {/* @ts-ignore */}
              <Wallet className="text-[#43a047] h-8 w-8" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Profit</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">${todayProfit.toFixed(2)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-[#ffb300]/10 to-[#ffca28]/10">
              {/* @ts-ignore */}
              <TrendingUp className="text-[#ffb300] h-8 w-8" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Order Value</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">${averageOrderValue.toFixed(2)}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {/* @ts-ignore */}
                <BarChart3 className="h-5 w-5 text-[#ff7043]" />
                Top Selling Items
              </h2>
              {topSellingItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No sales data available.</p>
              ) : (
                <div className="space-y-3">
                  {topSellingItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.quantity} sold</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {/* @ts-ignore */}
                <AlertTriangle className="h-5 w-5 text-[#ef5350]" />
                Low Stock Alerts
              </h2>
              {lowStockItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No low stock items.</p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="flex items-center gap-2">
                        {/* @ts-ignore */}
                        <Package className="h-5 w-5 text-[#ef5350]" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <p className="text-sm text-[#ef5350]">{item.quantity} left</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />
    </div>
  );
};

export default Reports;