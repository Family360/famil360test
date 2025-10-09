import React from "react";
import { Package, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryItem } from "@/services/localStorage";
import { useLanguage } from "@/hooks/useLanguage";

// Define props interface for InventoryList
interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onDelete }) => {
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const { t } = useLanguage();

  // Handle edit form submission
  const handleEditItem = () => {
    if (editingItem) {
      onEdit(editingItem);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('item')}</TableHead>
            <TableHead>{t('stock')}</TableHead>
            <TableHead>{t('unit')}</TableHead>
            <TableHead>{t('cost_price')}</TableHead>
            <TableHead>{t('low_stock_alert')}</TableHead>
            <TableHead>{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>₹{item.costPrice.toFixed(2)}</TableCell>
              <TableCell>{item.minStock}</TableCell>
              <TableCell>
                {/* Edit Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> {t('edit')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('edit_item')}</DialogTitle>
                      <DialogDescription>
                        {t('update_item_details')}
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder={t('item_name')}
                      value={editingItem?.name || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          name: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder={t('stock')}
                      value={editingItem?.stock || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          stock: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder={t('unit')}
                      value={editingItem?.unit || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          unit: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder={t('cost_price')}
                      value={editingItem?.costPrice || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          costPrice: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder={t('low_stock_alert')}
                      value={editingItem?.minStock || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          minStock: Number(e.target.value),
                        })
                      }
                    />
                    <DialogFooter>
                      <Button onClick={handleEditItem}>{t('save_changes')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('no_inventory_items')}
          </h3>
          <p className="text-muted-foreground">
            {t('add_first_inventory_item')}
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryList;