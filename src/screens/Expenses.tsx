import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { localStorageService } from "@/services/localStorage";
import type { Expense } from "@/services/localStorage";
import { useToast } from "@/components/ui/use-toast";
import ExpensesChart from "@/components/ExpensesChart";
import ExpensePieChart from "@/components/ExpensePieChart";
import { Loader2, Trash2, ChefHat, Plus, Search, ArrowLeft, DollarSign, Calendar, FileText } from "lucide-react";
import { useLanguageContext } from '../contexts/LanguageContext';
import { currencyService } from "../services/currencyService";

interface ExpensesProps {
  onNavigate?: (screen: string) => void;
}

const expenseTypes = [
  "Raw Material",
  "Wages",
  "Utilities",
  "Transport",
  "Miscellaneous",
];

const todayDateString = () => new Date().toISOString().slice(0, 10);

const Expenses: React.FC<ExpensesProps> = React.memo(({ onNavigate }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(expenseTypes[0]);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();
  const { t } = useLanguageContext();

  // Translate display labels for expense categories while keeping stored values (filters) in English
  const translateExpenseType = useCallback((name: string) => {
    switch (name) {
      case 'Raw Material':
        return t('raw_material');
      case 'Wages':
        return t('wages');
      case 'Utilities':
        return t('utilities');
      case 'Transport':
        return t('transport');
      case 'Miscellaneous':
        return t('miscellaneous');
      default:
        return name;
    }
  }, [t]);

  // Load expenses with error handling
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setIsLoading(true);
        const all = await localStorageService.getExpenses();
        setExpenses(all);
        setTodayExpenses(
          all.filter((e) => new Date(e.date).toISOString().slice(0, 10) === todayDateString())
        );
      } catch (error) {
        toast({
          title: t("error"),
          description: t("failed_to_load_expenses"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadExpenses();
  }, [toast, t]);

  const handleAddExpense = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || isNaN(+amount) || +amount <= 0) {
        toast({
          title: t("invalid_input"),
          description: t("enter_valid_amount"),
          variant: "destructive",
        });
        return;
      }
      try {
        const expense: Expense = {
          id: localStorageService.generateId(),
          type,
          amount: +amount,
          description: description.trim(),
          date: todayDateString(),
          createdAt: new Date().toISOString(),
        };
        await localStorageService.saveExpense(expense);
        const all = await localStorageService.getExpenses();
        setExpenses(all);
        setTodayExpenses(
          all.filter((e) => new Date(e.date).toISOString().slice(0, 10) === todayDateString())
        );
        setAmount("");
        setType(expenseTypes[0]);
        setDescription("");
        toast({
          title: t("expense_added"),
          description: `${t("added")} ${expense.type} ${t("expense_of")} ${currencyService.formatAmount(expense.amount)}.`,
        });
      } catch (error) {
        toast({
          title: t("error"),
          description: t("failed_to_add_expense"),
          variant: "destructive",
        });
      }
    },
    [amount, type, description, toast, t]
  );

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await localStorageService.deleteExpense(deleteId);
      const all = await localStorageService.getExpenses();
      setExpenses(all);
      setTodayExpenses(
        all.filter((e) => new Date(e.date).toISOString().slice(0, 10) === todayDateString())
      );
      toast({
        title: t("expense_deleted"),
        description: t("expense_has_been_removed"),
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_delete_expense"),
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, toast, t]);

  // Filtered expenses
  const filterExpenses = useCallback(
    (expenseList: Expense[]) => {
      return expenseList.filter((exp) => {
        const matchType = filterType === "All" || exp.type === filterType;
        const matchQuery =
          !debouncedSearchQuery.trim() ||
          exp.description?.toLowerCase().includes(debouncedSearchQuery.trim().toLowerCase());
        return matchType && matchQuery;
      });
    },
    [filterType, debouncedSearchQuery]
  );

  const filteredTodayExpenses = useMemo(
    () => filterExpenses(todayExpenses),
    [todayExpenses, filterExpenses]
  );
  const filteredPrevExpenses = useMemo(
    () => filterExpenses(expenses.filter((e) => new Date(e.date).toISOString().slice(0, 10) !== todayDateString())),
    [expenses, filterExpenses]
  );
  const todayTotal = useMemo(
    () => filteredTodayExpenses.reduce((t, e) => t + e.amount, 0),
    [filteredTodayExpenses]
  );

  // Chart data
  const last7DaysData = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const total = expenses
        .filter((e) => new Date(e.date).toISOString().slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({
        date: d.toLocaleDateString(undefined, { weekday: "short" }),
        total,
      });
    }
    return days;
  }, [expenses]);

  const thisMonthData = useMemo(() => {
    const data: { date: string; total: number }[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d);
      const dayStr = day.toISOString().slice(0, 10);
      const total = expenses
        .filter((e) => new Date(e.date).toISOString().slice(0, 10) === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      data.push({
        date: day.getDate().toString(),
        total,
      });
    }
    return data;
  }, [expenses]);

  const pieChartData = useMemo(() => {
    const now = new Date();
    const relevantExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      if (chartPeriod === "month") {
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      } else {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return expenseDate >= sevenDaysAgo;
      }
    });

    const groupedData = relevantExpenses.reduce((acc, expense) => {
      if (!acc[expense.type]) {
        acc[expense.type] = 0;
      }
      acc[expense.type] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedData).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses, chartPeriod]);

  const scrollToForm = useCallback(() => {
    const form = document.querySelector('form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
      const input = form.querySelector('input');
      if (input) {
        setTimeout(() => input.focus(), 500);
      }
    }
  }, []);

  return (
    <div className="px-4 py-4 pb-6 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] min-h-screen">
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

      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-blob">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#fff]/20 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg-[#fff]/30 animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg-[#FFF5F0]/20 animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Enhanced Header Section */}
      <div className="mb-6 p-5 glass-card shadow-lg animate-fade-in z-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center">
              <button 
                onClick={() => onNavigate ? onNavigate("dashboard") : window.history.back()}
                className="mr-3 p-2 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
                aria-label={t("go_back")}
              >
                <ArrowLeft size={18} className="text-[#ff7043]" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center">
                <DollarSign size={24} className="mr-2 text-[#ff7043] animate-pulse-slow" />
                {t("expenses")}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 animate-fade-in delay-100 flex items-center">
              <Calendar size={14} className="mr-1" />
              {t("manage_your_daily_costs")} – {new Date().toLocaleTimeString()}, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer z-0" />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 glass-card animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff7043] mb-2" />
          <p className="text-gray-600 dark:text-gray-400">{t("loading_expenses")}</p>
        </div>
      ) : (
        <>
          {/* Expense Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass-card p-3 text-center animate-fade-in delay-100">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Todays_expenses")}</div>
              <div className="text-xl font-bold text-[#ff7043] dark:text-[#ff9f43]">
                {currencyService.formatAmount(todayTotal)}
              </div>
            </div>
            <div className="glass-card p-3 text-center animate-fade-in delay-200">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Total_expenses")}</div>
              <div className="text-xl font-bold text-[#ff9f43] dark:text-[#ffb86c]">
                {currencyService.formatAmount(expenses.reduce((sum, e) => sum + e.amount, 0))}
              </div>
            </div>
            <div className="glass-card p-3 text-center animate-fade-in delay-300">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("Todays_count")}</div>
              <div className="text-xl font-bold text-[#ff7043] dark:text-[#ff9f43]">
                {filteredTodayExpenses.length}
              </div>
            </div>
            <div className="glass-card p-3 text-center animate-fade-in delay-400">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t("All_Time_Count")}</div>
              <div className="text-xl font-bold text-[#ff9f43] dark:text-[#ffb86c]">
                {expenses.length}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="glass-card p-5 mb-6 animate-fade-in delay-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t("Expense_Analysis")}</h2>
              <Select value={chartPeriod} onValueChange={(value) => setChartPeriod(value as "week" | "month")}>
                <SelectTrigger className="w-[140px] bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t("Last_7_days")}</SelectItem>
                  <SelectItem value="month">{t("This_month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-4 mobile-card bg-white/30 dark:bg-gray-800/30">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4">{t("Trend_Over_Time")}</h3>
                <ExpensesChart data={chartPeriod === "week" ? last7DaysData : thisMonthData} />
              </div>
              <div className="glass-card p-4 mobile-card bg-white/30 dark:bg-gray-800/30">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4">{t("Breakdown_By_Type")}</h3>
                <ExpensePieChart data={pieChartData} />
              </div>
            </div>
          </div>

          {/* Search and Filter Section - FIXED FOR MOBILE */}
          <div className="glass-card p-4 mb-6 animate-fade-in delay-300">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={t("Search_Expenses_By_Description")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-white/10 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-[#ff7043]/50 text-gray-700 dark:text-gray-300"
                  aria-label={t("Search_Expenses_By_Description")}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType("All")}
                  className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-colors ${
                    filterType === "All"
                      ? "bg-[#ff7043]/20 text-[#ff7043] shadow-md"
                      : "bg-white/30 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40"
                  }`}
                  aria-label={t("Show_All_Types")}
                >
                  {t("All_Types")}
                </button>
                {expenseTypes.map((expenseType) => (
                  <button
                    key={expenseType}
                    onClick={() => setFilterType(expenseType)}
                    className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      filterType === expenseType
                        ? "bg-[#ff7043]/20 text-[#ff7043] shadow-md"
                        : "bg-white/30 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40"
                    }`}
                    aria-label={`Show only ${expenseType} expenses`}
                  >
                    {translateExpenseType(expenseType)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="glass-card p-5 mb-6 animate-fade-in delay-400">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("Add_New_Expense")}</h2>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Type")}</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((et) => (
                      <SelectItem key={et} value={et}>{translateExpenseType(et)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("Amount")} <span className="text-[#ff7043]">*</span>
                </label>
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className="bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30"
                  aria-label={t("Expense_amount")}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Description")}</label>
                <Input
                  placeholder={t("Details_optional")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30"
                  aria-label={t("Expense_Description")}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 h-11"
                  aria-label={t("Add_expense")}
                >
                  <Plus size={16} className="mr-1" />
                  {t("Add_Expense")}
                </Button>
              </div>
            </form>
          </div>

          {/* Today's Expenses */}
          <div className="glass-card p-5 mb-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <ChefHat size={20} className="mr-2 text-[#ff7043]" />
                {t("Todays_Expenses")}
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredTodayExpenses.length} {t("Items")}
              </span>
            </div>
            
            {filteredTodayExpenses.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">{t("No_Expenses_Recorded_Today")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 dark:border-gray-700/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Type")}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Description")}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Amount")}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTodayExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-white/10 dark:border-gray-700/30 hover:bg-white/10 dark:hover:bg-gray-800/10">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{translateExpenseType(exp.type)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{exp.description || "—"}</td>
                        <td className="py-3 px-4 text-right text-[#ff7043] dark:text-[#ff9f43] font-medium">
                          {currencyService.formatAmount(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(exp.id)}
                            className="text-[#ff7043] hover:text-[#ff8a5b] hover:bg-[#ff7043]/10"
                            aria-label={`${t("Delete")} ${exp.type} ${t("Expense")}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4 pt-4 border-t border-white/10 dark:border-gray-700/30">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("Total_Today")}: <span className="text-[#ff7043] ml-2">{currencyService.formatAmount(todayTotal)}</span>
              </span>
            </div>
          </div>

          {/* Previous Expenses */}
          <div className="glass-card p-5 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <Calendar size={20} className="mr-2 text-[#ff7043]" />
                {t("Previous_Expenses")}
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPrevExpenses.length} {t("Items")}
              </span>
            </div>
            
            {filteredPrevExpenses.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">{t("No_Previous_Expense_Records")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 dark:border-gray-700/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Type")}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Description")}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Date")}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Amount")}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrevExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-white/10 dark:border-gray-700/30 hover:bg-white/10 dark:hover:bg-gray-800/10">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{translateExpenseType(exp.type)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{exp.description || "—"}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right text-[#ff7043] dark:text-[#ff9f43] font-medium">
                          {currencyService.formatAmount(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(exp.id)}
                            className="text-[#ff7043] hover:text-[#ff8a5b] hover:bg-[#ff7043]/10"
                            aria-label={`${t("delete")} ${exp.type} ${t("expense")}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="glass-card border border-white/10 dark:border-gray-700/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-800 dark:text-gray-100">{t("confirm_deletion")}</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                  {t("Are_you_sure_delete_expense")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/70 dark:bg-gray-700/70 border-white/10 dark:border-gray-700/30">{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c]"
                >
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-6 z-10">
        <Button
          onClick={scrollToForm}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] shadow-lg hover:shadow-xl hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all flex items-center justify-center"
          aria-label={t("add_New_Expense")}
        >
          <Plus size={24} />
        </Button>
      </div>
    </div>
  );
});

Expenses.displayName = 'Expenses';

export default Expenses;