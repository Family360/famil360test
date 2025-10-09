// src/components/AnalyticsDashboard.tsx
// Advanced analytics dashboard with forecasting, customer insights, and profit analysis

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, Target, Download, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { analyticsService, type AnalyticsSummary, type SalesForecast, type CustomerAnalytics, type ProfitAnalytics, type PeakHoursData } from '@/services/analyticsService';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { currencyService } from '@/services/currencyService';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const { t } = useLanguageContext();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsSummary(selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await analyticsService.exportAnalytics('csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodcart-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => currencyService.formatAmount(amount);
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="text-orange-500" size={24} />
            {t('analytics_dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('analytics_subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('daily')}</SelectItem>
              <SelectItem value="weekly">{t('weekly')}</SelectItem>
              <SelectItem value="monthly">{t('monthly')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download size={16} className="mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="customers">{t('customers')}</TabsTrigger>
          <TabsTrigger value="profits">{t('profits')}</TabsTrigger>
          <TabsTrigger value="forecasts">{t('forecasts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.profits.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.sales.length} {t('days_of_data')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('total_orders')}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.sales.reduce((sum, day) => sum + day.orders, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('across_all_days')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('profit_margin')}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analytics.profits.profitMargin)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.profits.totalProfit > 0 ? t('profitable') : t('loss_making')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('active_customers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.customers.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(analytics.customers.customerRetentionRate)} {t('retention')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sales_trend')}</CardTitle>
              <CardDescription>{t('sales_trend_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.sales.slice(-14).map((day, index) => (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-orange-500 rounded-t-sm min-h-[4px]"
                      style={{ height: `${(day.total / Math.max(...analytics.sales.map(d => d.total))) * 240}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2 rotate-45 origin-top-left">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>{t('peak_hours')}</CardTitle>
              <CardDescription>{t('peak_hours_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.peakHours.slice(0, 6).map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-gray-500" />
                      <span className="font-medium">{hour.hour}:00</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{hour.orders} {t('orders')}</span>
                      <span className="text-sm font-medium">{formatCurrency(hour.revenue)}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(hour.orders / Math.max(...analytics.peakHours.map(h => h.orders))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('customer_overview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{t('total_customers')}</span>
                  <Badge variant="secondary">{analytics.customers.totalCustomers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('new_customers')}</span>
                  <Badge variant="outline">{analytics.customers.newCustomers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('returning_customers')}</span>
                  <Badge variant="outline">{analytics.customers.returningCustomers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('avg_spend_per_customer')}</span>
                  <span className="font-medium">{formatCurrency(analytics.customers.averageSpendPerCustomer)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('retention_rate')}</span>
                  <span className="font-medium">{formatPercentage(analytics.customers.customerRetentionRate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Your most valuable customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customers.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <span className="font-medium text-green-600">{formatCurrency(analytics.profits.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Cost</span>
                  <span className="font-medium text-red-600">{formatCurrency(analytics.profits.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Profit</span>
                  <span className={cn(
                    "font-medium",
                    analytics.profits.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(analytics.profits.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Profit Margin</span>
                  <Badge variant={analytics.profits.profitMargin >= 0 ? "default" : "destructive"}>
                    {formatPercentage(analytics.profits.profitMargin)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Profit Items</CardTitle>
                <CardDescription>Most profitable menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.profits.topProfitItems.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatPercentage(item.margin)} {t('margin')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast</CardTitle>
              <CardDescription>Predicted sales for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.forecasts.map((forecast, index) => (
                  <div key={forecast.date} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        index === 0 ? "bg-red-500" : index === 1 ? "bg-orange-500" : "bg-blue-500"
                      )}></div>
                      <div>
                        <p className="font-medium">
                          {new Date(forecast.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('confidence')}: {formatPercentage(forecast.confidence)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{forecast.predictedOrders} {t('orders')}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(forecast.predictedRevenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
