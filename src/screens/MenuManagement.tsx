// src/screens/MenuManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { localStorageService, type MenuItem } from "../services/localStorage";
import { useToast } from '@/components/ui/use-toast';
import { currencyService } from '@/services/currencyService';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Crown, 
  ArrowLeft,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MenuManagementProps {
  onNavigate: (path: string) => void;
}

const FREE_MENU_LIMIT = 3;

const MenuManagement: React.FC<MenuManagementProps> = ({ onNavigate }) => {
  const { language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    stock: "0",
  });

  const { t } = useLanguage();
  const translate = useCallback((key: string, params?: Record<string, any>) => t(key, params), [t]);

  useEffect(() => {
    loadMenuItems();
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      await currencyService.getCurrency();
      const formatted = currencyService.formatAmountSimple(0);
      const symbol = formatted.replace(/[0-9,\.\s]/g, '');
      setCurrencySymbol(symbol);
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadMenuItems = useCallback(async () => {
    const items = await localStorageService.getMenuItems();
    setMenuItems(items);
  }, []);

  const categories = useMemo(() => {
    return [...new Set(menuItems.map((item) => item.category))].sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let filtered = menuItems;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    return filtered;
  }, [menuItems, searchQuery, categoryFilter]);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim() || !formData.category.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('please_fill_required_fields'),
      });
      return false;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('invalid_price'),
      });
      return false;
    }

    const stockNum = parseInt(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('invalid_stock'),
      });
      return false;
    }

    if (priceNum.toString().split(".")[1]?.length > 2) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: translate('price_too_many_decimals'),
      });
      return false;
    }

    return true;
  }, [formData, toast, translate]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const menuItem: MenuItem = {
      id: editingItem?.id || localStorageService.generateId(),
      name: formData.name.trim(),
      price: parseFloat(parseFloat(formData.price).toFixed(2)),
      category: formData.category.trim(),
      description: formData.description.trim(),
      isActive: editingItem?.isActive ?? true,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      stock: parseInt(formData.stock) || 0,
    };

    try {
      if (editingItem) {
        // Editing existing item - use saveMenuItem directly
        await localStorageService.saveMenuItem(menuItem);
      } else {
        // Adding new item - use addMenuItem which checks limits
        await localStorageService.addMenuItem(menuItem);
      }
      loadMenuItems();
      resetForm();
      
      toast({
        title: 'Success',
        description: editingItem ? 'Item updated successfully' : 'Item added successfully',
        className: 'bg-green-100 text-green-800',
      });
    } catch (error: any) {
      if (error.message === 'FREE_LIMIT_REACHED_PRODUCTS') {
        toast({
          title: 'Free Limit Reached',
          description: 'You have reached the 6 products limit. Upgrade to Premium for unlimited products.',
          variant: 'destructive',
        });
        // Dispatch event to open upgrade modal
        window.dispatchEvent(new CustomEvent('open-upgrade', { detail: { feature: 'Products' } }));
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save item',
          variant: 'destructive',
        });
      }
    }
  }, [validateForm, editingItem, formData, loadMenuItems, toast]);

  const resetForm = useCallback(() => {
    setFormData({ name: "", price: "", category: "", description: "", stock: "0" });
    setShowAddForm(false);
    setEditingItem(null);
  }, []);

  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || "",
      stock: item.stock?.toString() || "0",
    });
    setShowAddForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm(translate("confirm_delete_item"))) {
      localStorageService.deleteMenuItem(id);
      loadMenuItems();
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
        className: 'bg-green-100 text-green-800',
      });
    }
  }, [loadMenuItems, toast, translate]);

  const toggleActive = useCallback((item: MenuItem) => {
    const updatedItem = { ...item, isActive: !item.isActive };
    localStorageService.saveMenuItem(updatedItem);
    loadMenuItems();
    
    toast({
      title: 'Success',
      description: `Item ${updatedItem.isActive ? 'activated' : 'deactivated'}`,
      className: 'bg-green-100 text-green-800',
    });
  }, [loadMenuItems, toast]);

  const handleAddButtonClick = useCallback(() => {
    if (menuItems.length >= FREE_MENU_LIMIT && !editingItem) {
      setShowPricingModal(true);
    } else {
      setShowAddForm(true);
      setEditingItem(null);
      setFormData({ name: "", price: "", category: "", description: "", stock: "0" });
    }
  }, [menuItems.length, editingItem]);

  const groupedItems = useMemo(() => {
    const grouped: { [category: string]: MenuItem[] } = {};
    
    filteredItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-5 bg-white/70 dark:bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-white/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🍽️ {translate('menu_management')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your menu items • {menuItems.length} / {FREE_MENU_LIMIT} {translate('free')}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                {translate('back_to_dashboard')}
              </Button>
              
              <Button
                onClick={handleAddButtonClick}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} />
                {translate('add_item')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder={translate('search_items')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-800/30 border-white/30"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/30 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">{translate('all_categories')}</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {menuItems.length >= FREE_MENU_LIMIT && (
                <Button
                  onClick={() => setShowPricingModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                >
                  <Crown size={16} />
                  {translate('upgrade_to_premium')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6 bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30">
            <CardHeader>
              <CardTitle>
                {editingItem ? translate('edit_menu_item') : translate('add_new_menu_item')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={translate('eg_chicken_biryani')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/50 dark:bg-gray-800/30 border-white/30"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate('price_rupee')} ({currencySymbol})
                </label>
                <Input
                  type="number"
                  placeholder={translate('eg_150')}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/30 border-white/30"
                />
              </div>
              
              <Input
                placeholder={translate('eg_main_course_beverages')}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white/50 dark:bg-gray-800/30 border-white/30"
              />
              
              <Input
                placeholder={translate('brief_description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/50 dark:bg-gray-800/30 border-white/30"
              />
              
              <Input
                type="number"
                placeholder={translate('eg_10')}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="bg-white/50 dark:bg-gray-800/30 border-white/30"
              />
              
              <div className="flex gap-3">
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                  {editingItem ? translate('update_item') : translate('add_item')}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  {translate('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items List */}
        {Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                  {category} ({items.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30 transition-all hover:shadow-lg ${
                        !item.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {item.name}
                            </h3>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {currencyService.formatAmount(item.price)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(item)}
                              className="h-8 w-8 p-0"
                            >
                              {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Stock: {item.stock || 0}</span>
                          {!item.isActive && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                              {translate('inactive')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-white/70 dark:bg-gray-800/30 backdrop-blur-md border-white/30">
            <CardContent>
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {translate('no_menu_items_yet')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {translate('add_first_menu_item')}
              </p>
              <Button
                onClick={handleAddButtonClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {translate('add_menu_item')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pricing Modal - You'll need to create this component */}
        {/* <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} /> */}
      </div>
    </div>
  );
};

export default MenuManagement;