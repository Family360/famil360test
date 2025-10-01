// src/screens/InventoryManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { localStorageService, type InventoryItem } from "@/services/localStorage";
import { useToast } from "@/components/ui/use-toast";
import { Package, Loader2, Utensils, Plus, Search, AlertTriangle, ArrowLeft } from "lucide-react";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryList from "@/components/inventory/InventoryList";
import { cn } from "@/lib/utils";
// Change this line:
import languageService from '../services/languageService';
import { currencyService } from "../services/currencyService";

interface InventoryManagementProps {
  onNavigate: (path: string) => void;
}

const ITEMS_PER_PAGE = 10;

const InventoryManagement: React.FC<InventoryManagementProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lowStock">("all");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const t = useCallback((key: string) => {
    return languageService.translate(key) || key;
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const inventoryItems = localStorageService.getInventoryItems();
      setItems(inventoryItems);
    } catch (error) {
      const errorMessage = (error as Error).message || t("failed_to_load_inventory");
      setError(errorMessage);
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const handleAddButtonClick = useCallback(() => {
    setShowForm(true);
    setEditingItem(null);
  }, []);

  const handleFormSave = useCallback(
    (item: InventoryItem) => {
      try {
        localStorageService.saveInventoryItem(item);
        toast({
          title: editingItem ? t("item_updated") : t("item_added"),
          description: `${t("successfully")} ${editingItem ? t("updated") : t("added")} ${item.name} ${t("to_inventory")}.`,
        });
        loadItems();
        setShowForm(false);
        setEditingItem(null);
      } catch (error) {
        const errorMessage = (error as Error).message || `${t("failed_to")} ${editingItem ? t("update") : t("add")} ${t("inventory_item")}.`;
        toast({
          title: t("error"),
          description: `${errorMessage} ${t("please_try_again")}.`,
          variant: "destructive",
        });
      }
    },
    [editingItem, loadItems, toast, t]
  );

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleEdit = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteId) return;
    try {
      localStorageService.deleteInventoryItem(deleteId);
      loadItems();
      toast({
        title: t("item_deleted"),
        description: t("inventory_item_removed"),
        variant: "destructive",
      });
    } catch (error) {
      const errorMessage = (error as Error).message || t("failed_to_delete_inventory");
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, loadItems, toast, t]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === "lowStock" && item.quantity > item.lowStockAlert) return false;
      return item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });
  }, [items, debouncedSearchQuery, filter]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const inventoryStats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.quantity <= item.lowStockAlert).length;
    const outOfStockItems = items.filter(item => item.quantity === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    
    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  }, [items]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  if (error) {
    return (
      <div className="text-center py-12 glass-card">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={loadItems}
          className="bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 rounded-xl px-4 py-2"
          aria-label={t("retry_loading")}
        >
          Retry
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('dashboard')}
          className="ml-2"
          aria-label="Go back to dashboard"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] min-h-screen">
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
        .delay-400 { animation-delay: 0.4s; }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes gradientText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-text {
          background: linear-gradient(90deg, #ff7043, #ff9f43, #ff7043);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientText 4s ease infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }
        .dark .glass-card {
          background: rgba(26, 26, 46, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mobile-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .mobile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        }
        `}
      </style>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#fff]/20 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg [#fff]/30 animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg [#FFF5F0]/20 animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="mb-6 p-5 glass-card shadow-lg animate-fade-in z-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="mr-3 p-2 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
                aria-label={t("go_back")}
              >
                <ArrowLeft size={18} className="text-[#ff7043]" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center">
                <Package size={24} className="mr-2 text-[#ff7043] animate-pulse-slow" />
                {t("inventory")}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 animate-fade-in delay-100 flex items-center">
              <Utensils size={14} className="mr-1" />
              {t("track_your_stock")} – {new Date().toLocaleTimeString()}, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button
            onClick={handleAddButtonClick}
            className="flex items-center gap-2 bg-gradient-to-r from-[#ff7043] to [#ff9f43] text-white hover:from [#ff8a5b] hover:to [#ffb86c] transition-all duration-300 rounded-xl px-4 py-2 shadow-md hover:shadow-lg"
            aria-label={t("add_new_inventory_item")}
          >
            <Plus className="h-5 w-5" />
            {t("add_stock")}
          </Button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer z-0" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card p-3 text-center animate-fade-in delay-100">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Total_items")}</div>
          <div className="text-xl font-bold text-[#ff7043] dark:text-[#ff9f43]">{inventoryStats.totalItems}</div>
        </div>
        <div className="glass-card p-3 text-center animate-fade-in delay-200">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Total_value")}</div>
          <div className="text-xl font-bold text-[#ff9f43] dark:text-[#ffb86c]">
            {currencyService.formatAmount(inventoryStats.totalValue)}
          </div>
        </div>
        <div className={cn(
          "glass-card p-3 text-center animate-fade-in delay-300",
          inventoryStats.lowStockItems > 0 ? "bg-gradient-to-br from-[#ffe4e6]/50 to-[#fad2e1]/50" : ""
        )}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center">
            <AlertTriangle size={14} className="mr-1" />
            {t("Low_stock")}
          </div>
          <div className={cn(
            "text-xl font-bold",
            inventoryStats.lowStockItems > 0 ? "text-[#ff80ab] dark:text-[#ff99c2]" : "text-[#ff9f43] dark:text-[#ffb86c]"
          )}>
            {inventoryStats.lowStockItems}
          </div>
        </div>
        <div className={cn(
          "glass-card p-3 text-center animate-fade-in delay-400",
          inventoryStats.outOfStockItems > 0 ? "bg-gradient-to-br from-[#ffe4e6]/50 to-[#fad2e1]/50" : ""
        )}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Out_of_stock")}</div>
          <div className={cn(
            "text-xl font-bold",
            inventoryStats.outOfStockItems > 0 ? "text-[#ff80ab] dark:text-[#ff99c2]" : "text-[#ff9f43] dark:text-[#ffb86c]"
          )}>
            {inventoryStats.outOfStockItems}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-6 animate-fade-in delay-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={t("search_inventory_items")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-white/10 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-[#ff7043]/50 text-gray-700 dark:text-gray-300"
              aria-label={t("search_inventory_items_by_name")}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === "all"
                  ? "bg-[#ff7043]/20 text-[#ff7043] shadow-md"
                  : "bg-white/30 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40"
              }`}
              aria-label={t("show_all_items")}
            >
              {t("all")}
            </button>
            <button
              onClick={() => setFilter("lowStock")}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center ${
                filter === "lowStock"
                  ? "bg-[#ff7043]/20 text [#ff7043] shadow-md"
                  : "bg-white/30 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40"
              }`}
              aria-label={t("show_low_stock_items")}
            >
              <AlertTriangle size={16} className="mr-1" />
              {t("low_stock")}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 glass-card animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff7043] mb-2" />
          <p className="text-gray-600 dark:text-gray-400">{t("loading_inventory")}</p>
        </div>
      ) : (
        <>
          <InventoryForm
            editingItem={editingItem}
            show={showForm}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
          
          <div className="glass-card p-5 animate-fade-in delay-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {t("inventory_items")} ({filteredItems.length})
              </h2>
              {filteredItems.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("sorted_by")}: <span className="font-medium">{t("name")}</span>
                </div>
              )}
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{t("no_inventory_items_found")}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery ? `${t("no_items_matching")} "${searchQuery}"` : t("add_your_first_item_to_get_started")}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t("start_with_essential_ingredients")}</p>
                <Button
                  onClick={handleAddButtonClick}
                  className="mt-4 bg-gradient-to-r from-[#ff7043] to [#ff9f43] text-white hover:from [#ff8a5b] hover:to [#ffb86c] transition-all duration-300 rounded-xl px-4 py-2"
                >
                  <Plus size={16} className="mr-1" />
                  {t("add_first_item")}
                </Button>
              </div>
            ) : (
              <InventoryList
                items={paginatedItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {filteredItems.length > page * ITEMS_PER_PAGE && (
              <Button onClick={handleLoadMore} className="mt-4 w-full">
                Load More
              </Button>
            )}
          </div>
          
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="glass-card border border-white/10 dark:border-gray-700/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-800 dark:text-gray-100">{t("confirm_deletion")}</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                  {t("are_you_sure_delete_inventory_item")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/70 dark:bg-gray-700/70 border-white/10 dark:border-gray-700/30">{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-[#ff7043] to [#ff9f43] text-white hover:from [#ff8a5b] hover:to [#ffb86c]"
                >
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <div className="fixed bottom-20 right-6 z-10">
        <Button
          onClick={handleAddButtonClick}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#ff7043] to [#ff9f43] shadow-lg hover:shadow-xl hover:from [#ff8a5b] hover:to [#ffb86c] transition-all flex items-center justify-center"
          aria-label={t("add_new_inventory_item")}
        >
          <Plus size={24} />
        </Button>
      </div>
    </div>
  );
};

export default InventoryManagement;