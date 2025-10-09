// src/components/ReportsModal.tsx
import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Printer, FileText } from 'lucide-react';
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

  const generateReport = async () => {
    let data: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'sales':
        const salesReport = await localStorageService.getSalesReport(period);
        data = salesReport.orders.map((order: any) => ({
          'Order ID': order.id,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Time': new Date(order.createdAt).toLocaleTimeString(),
          'Customer': order.customerName || 'Walk-in',
          'Items': order.items.map((item: any) => `${item.name} x${item.quantity}`).join(', '),
          'Payment Method': order.paymentMethod.toUpperCase(),
          'Total Amount': order.total,
          'Notes': order.notes || ''
        }));
        filename = `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'expenses':
        const expenseReport = await localStorageService.getExpenseReport(period);
        data = expenseReport.expenses.map((expense: any) => ({
          'Expense ID': expense.id,
          'Date': new Date(expense.date).toLocaleDateString(),
          'Type': expense.type,
          'Description': expense.description,
          'Amount': expense.amount
        }));
        filename = `expenses_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'topItems':
        const topItems = await localStorageService.getTopSellingItems(period);
        data = topItems.map((item: any, index: number) => ({
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

  const printInvoice = async () => {
    // Generate a sample invoice for demonstration
    const invoiceData = {
      businessName: 'FoodCart360',
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      customerName: 'Walk-in Customer',
      items: [
        { name: 'Chicken Biryani', quantity: 2, price: 150, total: 300 },
        { name: 'Cold Drink', quantity: 1, price: 50, total: 50 }
      ],
      subtotal: 350,
      tax: 35,
      total: 385
    };

    printFormattedInvoice(invoiceData);
  };

  const printFormattedInvoice = (invoiceData: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${invoiceData.businessName}</h1>
          <h2>Invoice</h2>
        </div>

        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
          <p><strong>Date:</strong> ${invoiceData.date}</p>
        </div>

        <div class="customer-info">
          <p><strong>Customer:</strong> ${invoiceData.customerName}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <p>Subtotal: ₹${invoiceData.subtotal}</p>
          <p>Tax: ₹${invoiceData.tax}</p>
          <p>Total: ₹${invoiceData.total}</p>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated by FoodCart360 - Professional Food Stall Management</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">Export & Print Reports</h2>
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

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-card-foreground mb-3">Export Options</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={generateReport}
                className="flex items-center gap-2 justify-center"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </Button>

              <Button
                variant="outline"
                onClick={printInvoice}
                className="flex items-center gap-2 justify-center"
              >
                <Printer size={16} />
                Print Sample Invoice
              </Button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsModal;