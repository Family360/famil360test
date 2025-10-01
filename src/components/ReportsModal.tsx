// src/components/ReportsModal.tsx
import React, { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { localStorageService } from '../services/localStorage';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportsModal = ({ isOpen, onClose }: ReportsModalProps) => {
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'topItems'>('sales');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const generateReport = () => {
    let data: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'sales':
        const salesReport = localStorageService.getSalesReport(period);
        data = salesReport.orders.map(order => ({
          'Order ID': order.id,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Time': new Date(order.createdAt).toLocaleTimeString(),
          'Customer': order.customerName || 'Walk-in',
          'Items': order.items.map(item => `${item.name} x${item.quantity}`).join(', '),
          'Payment Method': order.paymentMethod.toUpperCase(),
          'Total Amount': order.total,
          'Notes': order.notes || ''
        }));
        filename = `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'expenses':
        const expenseReport = localStorageService.getExpenseReport(period);
        data = expenseReport.expenses.map(expense => ({
          'Expense ID': expense.id,
          'Date': new Date(expense.date).toLocaleDateString(),
          'Type': expense.type,
          'Description': expense.description,
          'Amount': expense.amount
        }));
        filename = `expenses_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'topItems':
        const topItems = localStorageService.getTopSellingItems(period);
        data = topItems.map((item, index) => ({
          'Rank': index + 1,
          'Item Name': item.name,
          'Category': item.category,
          'Quantity Sold': item.quantity,
          'Total Revenue': item.revenue,
          'Average Price': (item.revenue / item.quantity).toFixed(2)
        }));
        filename = `top_selling_items_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    if (data.length === 0) {
      alert(`No ${reportType} data found for the selected period.`);
      return;
    }

    downloadCSV(data, filename);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">Export Reports</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Report Type</label>
            <div className="space-y-2">
              {[
                { value: 'sales', label: 'Sales Report' },
                { value: 'expenses', label: 'Expenses Report' },
                { value: 'topItems', label: 'Top Selling Items' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reportType"
                    value={option.value}
                    checked={reportType === option.value}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="text-primary"
                  />
                  <span className="text-card-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Period</label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={generateReport} className="flex-1 flex items-center gap-2">
              <FileSpreadsheet size={16} />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsModal;