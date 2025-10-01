import React, { useEffect, useState, useCallback, useMemo } from "react";
import { localStorageService, type Order, type OrderItem } from "../services/localStorage";
import { currencyService } from '../services/currencyService';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Sparkles,
  Utensils,
  Truck,
  Package,
  Eye,
  Printer,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type OrdersListProps = {
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
  userProfile?: { fullName: string; email: string };
};

const DEFAULT_TRANSLATIONS = {
  orders: 'Orders',
  all_orders: 'All Orders',
  search_orders: 'Search orders...',
  filter_by_status: 'Filter by status',
  sort_by: 'Sort by',
  date: 'Date',
  total: 'Total',
  all_statuses: 'All Statuses',
  pending: 'Pending',
  preparing: 'Preparing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  loading_orders: 'Loading orders...',
  no_orders_found: 'No orders found',
  retry: 'Retry',
  dashboard: 'Dashboard',
  add_order: 'Add Order',
  back: 'Back',
  token: 'Token',
  status: 'Status',
  payment_method: 'Payment Method',
  items: 'Items',
  quantity: 'Qty',
  price: 'Price',
  view_details: 'View Details',
  total_amount: 'Total Amount',
  order_details: 'Order Details',
  created_at: 'Created At',
  refresh: 'Refresh',
  latest_data_loaded: 'Latest data loaded successfully',
  error: 'Error',
  failed_to_load_orders: 'Failed to load orders',
  cash: 'Cash',
  card: 'Card',
  digital: 'Digital',
  order_id: 'Order ID',
  recent_activity: 'Recent Activity',
  manage_orders: 'Manage Orders',
  order_status: 'Order Status',
  filter_options: 'Filter Options',
  sort_options: 'Sort Options',
  print_receipt: 'Print Receipt',
  download_pdf: 'Download PDF',
  customer_note: 'Customer Note',
  preparation_time: 'Prep Time',
  minutes: 'minutes',
  tax: 'Tax',
  subtotal: 'Subtotal',
};

const OrdersList: React.FC<OrdersListProps> = ({ onNavigate, onBack, userProfile }) => {
  const { toast } = useToast();
  const { language: currentLanguage } = useLanguage();

  const translate = useCallback(
    (key: string, params?: Record<string, any>) => {
      try {
        return DEFAULT_TRANSLATIONS[key as keyof typeof DEFAULT_TRANSLATIONS] || key;
      } catch (error) {
        console.warn(`Translation failed for key: ${key}`, error);
        return DEFAULT_TRANSLATIONS[key as keyof typeof DEFAULT_TRANSLATIONS] || key;
      }
    },
    []
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Simple app settings
  const [appSettings, setAppSettings] = useState({
    businessName: "Food Stall",
    tax: {
      enabled: true,
      rate: 13, // 13%
      name: "Tax"
    },
    autoToken: true
  });

  const loadOrders = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedOrders = localStorageService.getOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      const errorMessage = (err as Error).message || translate('failed_to_load_orders');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: translate('error'),
        description: errorMessage,
        className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, translate]);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      toast({
        title: translate('orders'),
        description: translate('latest_data_loaded'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg',
      });
      loadOrders();
    }, 800);
  }, [loadOrders, toast, translate]);

  // Simple print receipt function
  const printReceipt = useCallback((order: Order) => {
    try {
      // Generate receipt content
      const receiptContent = generateReceiptContent(order);
      
      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - Order ${order.tokenDisplay || order.id}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  margin: 0; 
                  padding: 10px;
                  background: white;
                  color: black;
                }
                .header { text-align: center; margin-bottom: 10px; }
                .business-name { font-weight: bold; font-size: 14px; }
                .order-info { margin: 5px 0; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
                .total-row { font-weight: bold; margin-top: 5px; }
                .note { margin-top: 8px; font-style: italic; }
                .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                @media print { 
                  body { margin: 0; } 
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${receiptContent}
              <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Print Receipt
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                  Close
                </button>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        toast({
          title: "Print Ready",
          description: "Receipt opened for printing",
          className: "bg-green-100 text-green-800",
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Failed to open print dialog',
      });
    }
  }, [toast]);

  // Generate receipt content
  const generateReceiptContent = useCallback((order: Order) => {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = appSettings.tax.enabled ? (subtotal * appSettings.tax.rate) / 100 : 0;
    const total = subtotal + taxAmount;

    return `
      <div class="header">
        <div class="business-name">${appSettings.businessName}</div>
        <div>Order #: ${order.tokenDisplay || order.id}</div>
        <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
      </div>
      <div class="divider"></div>
      
      ${order.items.map(item => `
        <div class="item-row">
          <span>${item.quantity}x ${item.name}</span>
          <span>${currencyService.formatAmount(item.price * item.quantity)}</span>
        </div>
      `).join('')}
      
      <div class="divider"></div>
      
      <div class="item-row">
        <span>Subtotal:</span>
        <span>${currencyService.formatAmount(subtotal)}</span>
      </div>
      
      ${appSettings.tax.enabled ? `
        <div class="item-row">
          <span>${appSettings.tax.name} (${appSettings.tax.rate}%):</span>
          <span>${currencyService.formatAmount(taxAmount)}</span>
        </div>
      ` : ''}
      
      <div class="item-row total-row">
        <span>Total:</span>
        <span>${currencyService.formatAmount(total)}</span>
      </div>
      
      ${order.customerNote ? `
        <div class="note">
          <strong>Note:</strong> ${order.customerNote}
        </div>
      ` : ''}
      
      ${order.preparationTime ? `
        <div class="note">
          <strong>Prep Time:</strong> ${order.preparationTime} minutes
        </div>
      ` : ''}
      
      <div class="divider"></div>
      <div class="footer">
        Thank you for your order!<br>
        ${new Date().getFullYear()} ${appSettings.businessName}
      </div>
    `;
  }, [appSettings]);

  // Download PDF receipt
  const downloadPDF = useCallback((order: Order) => {
    try {
      const receiptContent = generateReceiptContent(order);
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-order-${order.tokenDisplay || order.id}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Receipt saved as HTML file",
        className: "bg-blue-100 text-blue-800",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Error',
        description: 'Failed to download receipt',
      });
    }
  }, [generateReceiptContent, toast]);

  useEffect(() => {
    loadOrders();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'food_stall_orders') {
        loadOrders();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadOrders]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchQuery && 
          !order.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !order.tokenDisplay?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ) return false;
      return true;
    });

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.total - a.total;
      }
    });

    return filtered;
  }, [orders, statusFilter, searchQuery, sortBy]);

  const getStatusIcon = (status: string | undefined) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'preparing':
        return <ChefHat size={16} className="text-blue-500" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'preparing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return <DollarSign size={14} className="text-blue-500" />;
      case 'digital':
        return <Package size={14} className="text-purple-500" />;
      default:
        return <DollarSign size={14} className="text-green-500" />;
    }
  };

  const OrderSkeleton = () => (
    <div className="glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 mobile-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#3C2B23]/50 dark:to-[#4D362A]/50 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-24 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
        <div className="h-6 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
        <div className="h-4 w-3/4 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-20 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
        <div className="h-5 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
      </div>
    </div>
  );

  return (
    <div
      key={forceRender}
      className="min-h-screen px-4 py-4 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] overflow-hidden"
    >
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .dark .glass-card {
            background: rgba(26, 26, 46, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .mobile-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .mobile-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>

      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#e3f2fd]/50 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg-[#f3e5f5]/50 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg-[#e8f5e8]/50 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Enhanced Header Section */}
      <div className="mb-6 p-5 glass-card shadow-lg animate-fade-in z-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center">
                <ShoppingBag size={24} className="mr-2 text-[#ff7043]" />
                {translate('orders')}, {userProfile?.fullName?.split(' ')[0] || 'Chef'}!
              </h1>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 rounded-full bg-white/70 dark:bg-gray-800/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
                aria-label={translate('refresh')}
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-[#ff7043]' : 'text-gray-600 dark:text-gray-300'} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 animate-fade-in delay-100 flex items-center">
              <Sparkles size={14} className="mr-1" />
              {translate('manage_orders')} – {filteredOrders.length} {translate('orders').toLowerCase()} found
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/20 hover:bg-white/90 dark:hover:bg-gray-800/30 transition-all duration-300 border-white/30 rounded-xl px-3 py-2 shadow-sm"
                aria-label={translate('back')}
              >
                <ArrowLeft size={16} />
                {translate('back')}
              </Button>
            )}
            {onNavigate && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("dashboard")}
                  className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/20 hover:bg-white/90 dark:hover:bg-gray-800/30 transition-all duration-300 border-white/30 rounded-xl px-3 py-2 shadow-sm"
                  aria-label={translate('dashboard')}
                >
                  <Utensils size={16} />
                  {translate('dashboard')}
                </Button>
                <Button
                  variant="default"
                  onClick={() => onNavigate("newSale")}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white rounded-xl hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 shadow-md hover:shadow-xl"
                  aria-label={translate('add_order')}
                >
                  <Plus size={16} />
                  {translate('add_order')}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer z-0" />
      </div>

      {/* Search and Filter Section */}
      <div className="glass-card p-4 shadow-lg animate-fade-in delay-100 relative z-10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder={translate('search_orders')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/30 border-white/30 rounded-xl focus:ring-2 focus:ring-[#ff7043]/20"
              aria-label={translate('search_orders')}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/30 border border-white/30 rounded-xl focus:ring-2 focus:ring-[#ff7043]/20 appearance-none"
              aria-label={translate('filter_by_status')}
            >
              <option value="all">{translate('all_statuses')}</option>
              <option value="pending">{translate('pending')}</option>
              <option value="preparing">{translate('preparing')}</option>
              <option value="completed">{translate('completed')}</option>
              <option value="cancelled">{translate('cancelled')}</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/30 border border-white/30 rounded-xl focus:ring-2 focus:ring-[#ff7043]/20 appearance-none"
              aria-label={translate('sort_by')}
            >
              <option value="date">{translate('sort_by')} {translate('date')}</option>
              <option value="total">{translate('sort_by')} {translate('total')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 relative z-10">
        {isLoading ? (
          [...Array(6)].map((_, i) => <OrderSkeleton key={i} />)
        ) : error ? (
          <div className="glass-card p-8 text-center animate-fade-in">
            <XCircle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-500 dark:text-red-400 text-lg mb-4" role="alert">
              {error}
            </p>
            <Button
              variant="default"
              onClick={loadOrders}
              className="bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 rounded-xl px-6 py-2 shadow-md"
              aria-label={translate('retry')}
            >
              <RefreshCw size={16} className="mr-2" />
              {translate('retry')}
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-card p-8 text-center animate-fade-in">
            <Package size={64} className="mx-auto text-gray-400 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {translate('no_orders_found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No orders have been created yet'
              }
            </p>
            {onNavigate && (
              <Button
                variant="default"
                onClick={() => onNavigate("newSale")}
                className="bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 rounded-xl px-6 py-2 shadow-md"
                aria-label={translate('add_order')}
              >
                <Plus size={16} className="mr-2" />
                {translate('add_order')}
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={cn(
                "glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 mobile-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#3C2B23]/50 dark:to-[#4D362A]/50 cursor-pointer animate-fade-in",
                `delay-${Math.min(index * 100, 400)}`
              )}
              onClick={() => onNavigate && onNavigate(`order/${order.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate(`order/${order.id}`)}
              tabIndex={0}
              role="button"
              aria-label={`View order details for ${order.tokenDisplay || order.id}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                    <ShoppingBag size={20} className="text-[#ff7043]" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                      #{order.tokenDisplay || order.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(order.createdAt).toLocaleString('en-US', { 
                        timeZone: 'Asia/Karachi',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(order.status || 'pending'))}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{translate((order.status || 'pending') as keyof typeof DEFAULT_TRANSLATIONS)}</span>
                  </span>
                  <button 
                    className="p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add receipt actions menu here
                    }}
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Customer Note Display */}
              {order.customerNote && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-300 font-medium flex items-center gap-1">
                    <FileText size={12} />
                    {translate('customer_note')}:
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    {order.customerNote}
                  </div>
                </div>
              )}

              {/* Preparation Time Display */}
              {order.preparationTime && (
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>{translate('preparation_time')}:</span>
                  <span className="font-medium text-[#ff9f43]">{order.preparationTime} {translate('minutes')}</span>
                </div>
              )}

              <div className="mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{translate('items')}:</div>
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 dark:text-gray-200 font-medium line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-gray-500 text-xs">×{item.quantity}</span>
                      </div>
                      <div className="font-medium text-[#ff9f43]">
                        {currencyService.formatAmount(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      +{order.items.length - 3} more items
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/20 dark:border-gray-700/30">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {getPaymentMethodIcon(order.paymentMethod)}
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#ff9f43] dark:text-[#ffb86c]">
                    {currencyService.formatAmount(order.total)}
                  </span>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Receipt Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/20 dark:border-gray-700/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    printReceipt(order);
                  }}
                  className="flex-1 flex items-center gap-2 bg-white/50 dark:bg-gray-800/30 border-white/30"
                >
                  <Printer size={14} />
                  {translate('print_receipt')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPDF(order);
                  }}
                  className="flex-1 flex items-center gap-2 bg-white/50 dark:bg-gray-800/30 border-white/30"
                >
                  <FileText size={14} />
                  {translate('download_pdf')}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {onNavigate && (
        <div className="fixed bottom-6 right-6 z-20 md:hidden">
          <Button
            variant="default"
            onClick={() => onNavigate("newSale")}
            className="rounded-full w-14 h-14 bg-gradient-to-r from-[#ff7043] to-[#ff9f43] shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
            aria-label={translate('add_order')}
          >
            <Plus size={24} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersList;