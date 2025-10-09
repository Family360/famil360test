// Tip Distribution Management Service
import { localStorageService } from './localStorage';

export interface StaffMember {
  id: string;
  name: string;
  role: 'chef' | 'waiter' | 'cashier' | 'helper' | 'manager';
  sharePercentage: number; // Percentage of tips
  active: boolean;
  createdAt: string;
}

export interface TipEntry {
  id: string;
  amount: number;
  date: string;
  source: 'cash' | 'card' | 'digital';
  orderId?: string;
  distributedAt?: string;
  distributed: boolean;
  staffDistribution?: StaffDistribution[];
  notes?: string;
}

export interface StaffDistribution {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;
}

export interface TipDistributionSettings {
  autoDistribute: boolean;
  distributionMethod: 'equal' | 'percentage' | 'custom';
  defaultShares: {
    chef: number;
    waiter: number;
    cashier: number;
    helper: number;
    manager: number;
  };
}

class TipDistributionService {
  private readonly STAFF_KEY = 'tip_staff_members';
  private readonly TIPS_KEY = 'tip_entries';
  private readonly SETTINGS_KEY = 'tip_distribution_settings';

  // Default settings
  private defaultSettings: TipDistributionSettings = {
    autoDistribute: false,
    distributionMethod: 'percentage',
    defaultShares: {
      chef: 30,
      waiter: 35,
      cashier: 15,
      helper: 10,
      manager: 10,
    },
  };

  // ===== STAFF MANAGEMENT =====

  async getStaffMembers(): Promise<StaffMember[]> {
    try {
      const data = localStorage.getItem(this.STAFF_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading staff members:', error);
      return [];
    }
  }

  async addStaffMember(staff: Omit<StaffMember, 'id' | 'createdAt'>): Promise<StaffMember> {
    const newStaff: StaffMember = {
      ...staff,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const staffList = await this.getStaffMembers();
    staffList.push(newStaff);
    localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));

    return newStaff;
  }

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<void> {
    const staffList = await this.getStaffMembers();
    const index = staffList.findIndex((s) => s.id === id);

    if (index !== -1) {
      staffList[index] = { ...staffList[index], ...updates };
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(staffList));
    }
  }

  async deleteStaffMember(id: string): Promise<void> {
    const staffList = await this.getStaffMembers();
    const filtered = staffList.filter((s) => s.id !== id);
    localStorage.setItem(this.STAFF_KEY, JSON.stringify(filtered));
  }

  async getActiveStaff(): Promise<StaffMember[]> {
    const staff = await this.getStaffMembers();
    return staff.filter((s) => s.active);
  }

  // ===== TIP MANAGEMENT =====

  async getTipEntries(startDate?: string, endDate?: string): Promise<TipEntry[]> {
    try {
      const data = localStorage.getItem(this.TIPS_KEY);
      let tips: TipEntry[] = data ? JSON.parse(data) : [];

      if (startDate || endDate) {
        tips = tips.filter((tip) => {
          const tipDate = new Date(tip.date);
          if (startDate && tipDate < new Date(startDate)) return false;
          if (endDate && tipDate > new Date(endDate)) return false;
          return true;
        });
      }

      return tips;
    } catch (error) {
      console.error('Error loading tip entries:', error);
      return [];
    }
  }

  async addTipEntry(tip: Omit<TipEntry, 'id' | 'distributed'>): Promise<TipEntry> {
    const newTip: TipEntry = {
      ...tip,
      id: this.generateId(),
      distributed: false,
    };

    const tips = await this.getTipEntries();
    tips.push(newTip);
    localStorage.setItem(this.TIPS_KEY, JSON.stringify(tips));

    // Auto-distribute if enabled
    const settings = await this.getSettings();
    if (settings.autoDistribute) {
      await this.distributeTip(newTip.id);
    }

    return newTip;
  }

  async distributeTip(tipId: string): Promise<void> {
    const tips = await this.getTipEntries();
    const tipIndex = tips.findIndex((t) => t.id === tipId);

    if (tipIndex === -1) return;

    const tip = tips[tipIndex];
    const staff = await this.getActiveStaff();
    const settings = await this.getSettings();

    // Calculate distribution
    const distribution = this.calculateDistribution(
      tip.amount,
      staff,
      settings.distributionMethod
    );

    // Update tip entry
    tips[tipIndex] = {
      ...tip,
      distributed: true,
      distributedAt: new Date().toISOString(),
      staffDistribution: distribution,
    };

    localStorage.setItem(this.TIPS_KEY, JSON.stringify(tips));
  }

  async distributeBulkTips(tipIds: string[]): Promise<void> {
    for (const tipId of tipIds) {
      await this.distributeTip(tipId);
    }
  }

  private calculateDistribution(
    amount: number,
    staff: StaffMember[],
    method: 'equal' | 'percentage' | 'custom'
  ): StaffDistribution[] {
    if (staff.length === 0) return [];

    if (method === 'equal') {
      const equalShare = amount / staff.length;
      return staff.map((s) => ({
        staffId: s.id,
        staffName: s.name,
        amount: equalShare,
        percentage: 100 / staff.length,
      }));
    }

    // Percentage-based distribution
    const totalPercentage = staff.reduce((sum, s) => sum + s.sharePercentage, 0);

    return staff.map((s) => {
      const percentage = (s.sharePercentage / totalPercentage) * 100;
      return {
        staffId: s.id,
        staffName: s.name,
        amount: (amount * s.sharePercentage) / totalPercentage,
        percentage,
      };
    });
  }

  // ===== ANALYTICS =====

  async getTipSummary(startDate?: string, endDate?: string) {
    const tips = await this.getTipEntries(startDate, endDate);

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const distributedTips = tips.filter((t) => t.distributed);
    const pendingTips = tips.filter((t) => !t.distributed);

    const totalDistributed = distributedTips.reduce((sum, tip) => sum + tip.amount, 0);
    const totalPending = pendingTips.reduce((sum, tip) => sum + tip.amount, 0);

    // By source
    const bySource = {
      cash: tips.filter((t) => t.source === 'cash').reduce((sum, t) => sum + t.amount, 0),
      card: tips.filter((t) => t.source === 'card').reduce((sum, t) => sum + t.amount, 0),
      digital: tips.filter((t) => t.source === 'digital').reduce((sum, t) => sum + t.amount, 0),
    };

    return {
      totalTips,
      totalDistributed,
      totalPending,
      distributedCount: distributedTips.length,
      pendingCount: pendingTips.length,
      bySource,
      averageTip: tips.length > 0 ? totalTips / tips.length : 0,
    };
  }

  async getStaffEarnings(staffId: string, startDate?: string, endDate?: string) {
    const tips = await this.getTipEntries(startDate, endDate);
    const distributedTips = tips.filter((t) => t.distributed && t.staffDistribution);

    let totalEarnings = 0;
    let tipCount = 0;

    distributedTips.forEach((tip) => {
      const staffShare = tip.staffDistribution?.find((d) => d.staffId === staffId);
      if (staffShare) {
        totalEarnings += staffShare.amount;
        tipCount++;
      }
    });

    return {
      totalEarnings,
      tipCount,
      averagePerTip: tipCount > 0 ? totalEarnings / tipCount : 0,
    };
  }

  async getAllStaffEarnings(startDate?: string, endDate?: string) {
    const staff = await this.getStaffMembers();
    const earnings = await Promise.all(
      staff.map(async (s) => ({
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        ...(await this.getStaffEarnings(s.id, startDate, endDate)),
      }))
    );

    return earnings.sort((a, b) => b.totalEarnings - a.totalEarnings);
  }

  // ===== SETTINGS =====

  async getSettings(): Promise<TipDistributionSettings> {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : this.defaultSettings;
    } catch (error) {
      console.error('Error loading tip settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(settings: Partial<TipDistributionSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  // ===== UTILITIES =====

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportTipData(startDate?: string, endDate?: string) {
    const tips = await this.getTipEntries(startDate, endDate);
    const staff = await this.getStaffMembers();
    const summary = await this.getTipSummary(startDate, endDate);
    const earnings = await this.getAllStaffEarnings(startDate, endDate);

    return {
      tips,
      staff,
      summary,
      earnings,
      exportedAt: new Date().toISOString(),
    };
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.STAFF_KEY);
    localStorage.removeItem(this.TIPS_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);
  }
}

export const tipDistributionService = new TipDistributionService();
export default tipDistributionService;
