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

// Define props interface for InventoryList
interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onDelete }) => {
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);

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
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Low Stock Alert</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>₹{item.costPrice.toFixed(2)}</TableCell>
              <TableCell>{item.lowStockAlert}</TableCell>
              <TableCell>
                {/* Edit Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                      <DialogDescription>
                        Update the details of your inventory item.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Item name"
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
                      placeholder="Quantity"
                      value={editingItem?.quantity || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          quantity: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder="Unit"
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
                      placeholder="Cost Price"
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
                      placeholder="Low Stock Alert"
                      value={editingItem?.lowStockAlert || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...(editingItem as InventoryItem),
                          lowStockAlert: Number(e.target.value),
                        })
                      }
                    />
                    <DialogFooter>
                      <Button onClick={handleEditItem}>Save changes</Button>
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
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
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
            No inventory items
          </h3>
          <p className="text-muted-foreground">
            Add your first inventory item to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryList;