import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem, localStorageService } from "@/services/localStorage";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

const unitOptions = ["kg", "units", "liters", "grams"];

interface InventoryFormProps {
  editingItem: InventoryItem | null;
  show: boolean;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ editingItem, show, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: unitOptions[0],
    lowStockAlert: "",
    costPrice: "",
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        quantity: editingItem.stock.toString(),
        unit: editingItem.unit,
        lowStockAlert: editingItem.minStock.toString(),
        costPrice: editingItem.costPrice.toString(),
      });
    } else {
      setFormData({
        name: "",
        quantity: "",
        unit: unitOptions[0],
        lowStockAlert: "",
        costPrice: "",
      });
    }
  }, [editingItem, show]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.quantity || isNaN(+formData.quantity) || +formData.quantity <= 0) {
      toast({
        title: t('invalid_input'),
        description: t('please_provide_valid_name_quantity'),
        variant: "destructive",
      });
      return;
    }

    const item: InventoryItem = {
      id: editingItem?.id || localStorageService.generateId(),
      name: formData.name.trim(),
      stock: +formData.quantity,
      unit: formData.unit,
      minStock: +formData.lowStockAlert || 0,
      costPrice: +formData.costPrice || 0,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    onSave(item);
  }, [formData, editingItem, onSave, toast]);

  if (!show) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editingItem ? t('edit_item') : t('add_new_item')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-foreground">
              {t('item_name')} <span className="text-destructive">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Basmati Rice"
              required
              aria-label="Inventory item name"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-foreground">
              {t('quantity')} <span className="text-destructive">*</span>
            </label>
            <Input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 5"
              min="1"
              required
              aria-label="Inventory item quantity"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-foreground">{t('unit')}</label>
            <Select
              name="unit"
              value={formData.unit}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_unit')} />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-foreground">{t('low_stock_alert')}</label>
            <Input
              name="lowStockAlert"
              type="number"
              value={formData.lowStockAlert}
              onChange={handleInputChange}
              placeholder="e.g., 2"
              min="0"
              aria-label="Low stock alert threshold"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-foreground">{t('cost_price')}</label>
            <Input
              name="costPrice"
              type="number"
              value={formData.costPrice}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              min="0"
              aria-label="Cost price per unit"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} aria-label="Save inventory item">
            {editingItem ? t('update') : t('add')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;