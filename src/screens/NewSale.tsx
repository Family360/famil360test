// src/screens/NewSale.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { localStorageService, type MenuItem, type Order } from '../services/localStorage';
import { currencyService } from '../services/currencyService';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Package, 
  X, 
  Printer, 
  ArrowLeft,
  FileText,
  Clock,
  Utensils,
  Store,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import adsService from '@/services/adsService';

interface NewSaleProps {
  onNavigate: (path: string) => void;
}

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

// Translations are sourced from languageService via useLanguage().

const NewSale: React.FC<NewSaleProps> = ({ onNavigate }) => {
  const { language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'delivery' | 'takeaway'>('dine-in');
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    price: '',
    category: 'Custom',
  });
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Simple app settings (same as OrdersList)
  const [appSettings] = useState({
    businessName: "Food Stall",
    tax: {
      enabled: true,
      rate: 13,
      name: "Tax"
    },
    autoToken: true
  });

  const { t } = useLanguage();
  const translate = useCallback((key: string, params?: Record<string, any>) => t(key, params), [t]);

  const loadMenuItems = useCallback(async () => {
    const items = await localStorageService.getMenuItems();
    setMenuItems(items);
  }, []);

  useEffect(() => {
    loadMenuItems();
    // Preload interstitial for free users
    (async () => {
      try {
        const isPremium = typeof window !== 'undefined' && localStorage.getItem('is_premium') === 'true';
        if (!isPremium) {
          await adsService.loadInterstitial();
        }
      } catch {}
    })();
  }, [loadMenuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => item.isActive)
      .filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [menuItems, searchTerm]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.menuItemId === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { 
        menuItemId: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }];
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} added to cart`,
      className: "bg-green-100 text-green-800",
    });
  }, [toast]);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.menuItemId === menuItemId);
      if (!item) return prev;
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(i => i.menuItemId !== menuItemId);
      }
      return prev.map(i => 
        i.menuItemId === menuItemId ? { ...i, quantity: newQuantity } : i
      );
    });
  }, []);

  const totalAmount = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = appSettings.tax.enabled ? (subtotal * appSettings.tax.rate) / 100 : 0;
    return subtotal + taxAmount;
  }, [cart, appSettings.tax]);

  const subtotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return appSettings.tax.enabled ? (subtotalAmount * appSettings.tax.rate) / 100 : 0;
  }, [subtotalAmount, appSettings.tax]);

  const handleCustomItemSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customItem.price);
    if (!customItem.name.trim() || isNaN(price) || price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('invalid_custom_item'),
      });
      return;
    }

    const newItem: MenuItem = {
      id: `custom_${Date.now()}`,
      name: customItem.name.trim(),
      price: parseFloat(price.toFixed(2)),
      category: customItem.category.trim(),
      description: '',
      stock: 999,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    localStorageService.saveMenuItem(newItem);
    addToCart(newItem);
    setCustomItem({ name: '', price: '', category: 'Custom' });
    setShowCustomItemForm(false);
    loadMenuItems();
    
    toast({
      title: 'Success',
      description: 'Custom item added to cart',
      className: 'bg-green-100 text-green-800',
    });
  }, [customItem, addToCart, loadMenuItems, toast, translate]);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('empty_cart'),
      });
      return;
    }

    const orders = await localStorageService.getOrders();
    const tokenNumber = orders.length + 1;
    
    const order: Order = {
      id: localStorageService.generateId(),
      items: cart,
      total: totalAmount,
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
      notes: customerNote,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      tokenDisplay: tokenNumber.toString(),
      tokenNumber: tokenNumber,
      status: 'pending',
      // New fields we added
      customerNote: customerNote,
      preparationTime: preparationTime ? parseInt(preparationTime) : undefined,
      orderType: orderType,
    };

    try {
      await localStorageService.saveOrder(order);
      setLastOrder(order);
      setShowInvoice(true);
      
      // Show interstitial for free users every 5th order
      try {
        const isPremium = typeof window !== 'undefined' && localStorage.getItem('is_premium') === 'true';
        if (!isPremium) {
          await adsService.maybeShowInterstitial(5);
        }
      } catch {}
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerNote('');
      setPreparationTime('');
      setOrderType('dine-in');
      
      toast({
        title: translate('order_created'),
        description: `Order #${tokenNumber} created successfully`,
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white',
      });
    } catch (error: any) {
      if (error.message === 'FREE_LIMIT_REACHED_ORDERS') {
        toast({
          title: 'Free Limit Reached',
          description: 'You have reached the 20 orders/month limit. Upgrade to Premium for unlimited orders.',
          variant: 'destructive',
        });
        // Dispatch event to open upgrade modal
        window.dispatchEvent(new CustomEvent('open-upgrade', { detail: { feature: 'Orders' } }));
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save order',
          variant: 'destructive',
        });
      }
    }
  }, [cart, totalAmount, paymentMethod, customerName, customerNote, preparationTime, toast, translate]);

  const printReceipt = useCallback((order: Order) => {
    try {
      const receiptContent = generateReceiptContent(order);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - Order ${order.tokenDisplay}</title>
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

  const generateReceiptContent = useCallback((order: Order) => {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = appSettings.tax.enabled ? (subtotal * appSettings.tax.rate) / 100 : 0;
    const total = subtotal + taxAmount;

    return `
      <div class="header">
        <div class="business-name">${appSettings.businessName}</div>
        <div>Order #: ${order.tokenDisplay}</div>
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

  const downloadPDF = useCallback((order: Order) => {
    try {
      const receiptContent = generateReceiptContent(order);
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-order-${order.tokenDisplay}.html`;
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

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-5 bg-white/70 dark:bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-white/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Utensils size={24} className="text-[#ff7043]" />
                {translate('new_sale')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create new order • {cart.length} items in cart
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/30 border-white/30"
            >
              <ArrowLeft size={16} />
              {translate('back_to_dashboard')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{translate('menu_items')}</span>
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                    className="flex items-center gap-2"
                  >
                    <Package size={16} />
                    {showCustomItemForm ? translate('cancel') : translate('add_custom_item')}
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {showCustomItemForm && (
                  <form onSubmit={handleCustomItemSubmit} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        placeholder={translate('enter_item_name')}
                        value={customItem.name}
                        onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />
                      <Input
                        type="number"
                        placeholder={translate('enter_price')}
                        value={customItem.price}
                        onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />
                      <Input
                        placeholder={translate('enter_category')}
                        value={customItem.category}
                        onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {translate('add_item')}
                    </Button>
                  </form>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder={translate('search_by_name_or_category')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-gray-800/30 border-white/30"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredMenuItems.map(item => (
                    <Card 
                      key={item.id} 
                      className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-md border-white/30 transition-all hover:shadow-lg"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.category}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="text-lg font-bold text-[#ff9f43] dark:text-[#ffb86c] mt-2">
                              {currencyService.formatAmount(item.price)}
                            </p>
                          </div>
                          <Button
                            onClick={() => addToCart(item)}
                            disabled={item.stock <= 0}
                            className={cn(
                              "bg-[#ff7043] hover:bg-[#ff8a5b]",
                              item.stock <= 0 && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {item.stock <= 0 ? translate('out_of_stock') : translate('add_to_cart')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  {translate('cart')} ({cart.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {translate('empty_cart')}
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.menuItemId} className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {currencyService.formatAmount(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.menuItemId, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="font-medium w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.menuItemId, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-white/20 dark:border-gray-700/30 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{translate('subtotal')}:</span>
                        <span className="font-medium">{currencyService.formatAmount(subtotalAmount)}</span>
                      </div>
                      {appSettings.tax.enabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {appSettings.tax.name} ({appSettings.tax.rate}%):
                          </span>
                          <span className="font-medium">{currencyService.formatAmount(taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-white/20 dark:border-gray-700/30 pt-2">
                        <span>{translate('total')}:</span>
                        <span className="text-[#ff9f43] dark:text-[#ffb86c]">
                          {currencyService.formatAmount(totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                      <Input
                        placeholder={translate('enter_customer_name')}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {translate('payment_method')}
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'upi' | 'card')}
                          className="w-full p-2 bg-white/50 dark:bg-gray-800/30 border border-white/30 rounded-lg focus:ring-2 focus:ring-[#ff7043]/20"
                        >
                          <option value="cash">{translate('cash')}</option>
                          <option value="upi">{translate('upi')}</option>
                          <option value="card">{translate('card')}</option>
                        </select>
                      </div>

                      {/* Order Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {translate('order_type')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderType('dine-in')}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                              orderType === 'dine-in'
                                ? "border-[#ff7043] bg-[#ff7043]/10 text-[#ff7043]"
                                : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:border-[#ff7043]/50"
                            )}
                          >
                            <Store size={20} />
                            <span className="text-xs font-medium">{translate('dine_in')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('delivery')}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                              orderType === 'delivery'
                                ? "border-[#ff7043] bg-[#ff7043]/10 text-[#ff7043]"
                                : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:border-[#ff7043]/50"
                            )}
                          >
                            <Truck size={20} />
                            <span className="text-xs font-medium">{translate('delivery')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('takeaway')}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                              orderType === 'takeaway'
                                ? "border-[#ff7043] bg-[#ff7043]/10 text-[#ff7043]"
                                : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:border-[#ff7043]/50"
                            )}
                          >
                            <ShoppingBag size={20} />
                            <span className="text-xs font-medium">{translate('takeaway')}</span>
                          </button>
                        </div>
                      </div>

                      {/* New Fields */}
                      <Input
                        placeholder={translate('special_instructions')}
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />
                      
                      <Input
                        type="number"
                        placeholder={translate('estimated_prep_time')}
                        value={preparationTime}
                        onChange={(e) => setPreparationTime(e.target.value)}
                        className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                      />

                      <Button 
                        onClick={handleCheckout} 
                        className="w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] hover:from-[#ff8a5b] hover:to-[#ffb86c] text-white"
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        {translate('checkout')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice Modal */}
        {showInvoice && lastOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-white/30">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{translate('invoice')}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvoice(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={14} />
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p><strong>{translate('order_id')}:</strong> #{lastOrder.tokenDisplay}</p>
                  <p><strong>{translate('customer')}:</strong> {lastOrder.customerName}</p>
                  <p><strong>{translate('date')}:</strong> {new Date(lastOrder.createdAt).toLocaleString()}</p>
                  <p><strong>{translate('payment_method')}:</strong> {lastOrder.paymentMethod.toUpperCase()}</p>
                  
                  <div>
                    <strong>{translate('items')}:</strong>
                    <div className="mt-2 space-y-1">
                      {lastOrder.items.map(item => (
                        <div key={item.menuItemId} className="flex justify-between">
                          <span>{item.name} ×{item.quantity}</span>
                          <span>{currencyService.formatAmount(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>{translate('subtotal')}:</span>
                      <span>{currencyService.formatAmount(subtotalAmount)}</span>
                    </div>
                    {appSettings.tax.enabled && (
                      <div className="flex justify-between">
                        <span>{appSettings.tax.name} ({appSettings.tax.rate}%):</span>
                        <span>{currencyService.formatAmount(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>{translate('total')}:</span>
                      <span>{currencyService.formatAmount(lastOrder.total)}</span>
                    </div>
                  </div>
                  
                  {lastOrder.customerNote && (
                    <p><strong>{translate('notes')}:</strong> {lastOrder.customerNote}</p>
                  )}
                  
                  {lastOrder.preparationTime && (
                    <p><strong>{translate('preparation_time')}:</strong> {lastOrder.preparationTime} {translate('minutes')}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => printReceipt(lastOrder)} 
                    className="flex-1 flex items-center gap-2"
                  >
                    <Printer size={16} />
                    {translate('print_receipt')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => downloadPDF(lastOrder)} 
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {translate('download_invoice')}
                  </Button>
                </div>
                
                <Button 
                  onClick={() => {
                    setShowInvoice(false);
                    onNavigate('orders');
                  }} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  View All Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewSale;