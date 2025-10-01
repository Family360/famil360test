// src/components/CashBalanceModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { currencyService } from "../services/currencyService";
import { cn } from "@/lib/utils";

interface CashBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (balances: {
    openingBalance: number;
    cashInHand: number;
    closingBalance: number;
  }) => void;
}

const CashBalanceModal = ({ isOpen, onClose, onSave }: CashBalanceModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    openingBalance: "",
    cashInHand: "",
    closingBalance: "",
  });
  const [errors, setErrors] = useState({
    openingBalance: "",
    cashInHand: "",
    closingBalance: "",
  });

  const currency = currencyService.getCurrency();

  const validateInput = (value: string, field: string): string => {
    if (!value) return `${field} is required`;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return `${field} must be a positive number`;
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateInput(value, name) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      openingBalance: validateInput(formData.openingBalance, "Opening Balance"),
      cashInHand: validateInput(formData.cashInHand, "Cash in Hand"),
      closingBalance: validateInput(formData.closingBalance, "Closing Balance"),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    try {
      onSave({
        openingBalance: parseFloat(formData.openingBalance),
        cashInHand: parseFloat(formData.cashInHand),
        closingBalance: parseFloat(formData.closingBalance),
      });
      toast({
        title: "Balances Saved",
        description: "Cash balances have been updated successfully.",
      });
      onClose();
    } catch (error: any) {
      console.error("Error saving balances:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the balances. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Manage Cash Balances
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Update your opening, in-hand, and closing cash balances below.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div>
            <Label
              htmlFor="openingBalance"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Opening Balance ({currency})
            </Label>
            <Input
              id="openingBalance"
              name="openingBalance"
              type="number"
              value={formData.openingBalance}
              onChange={handleInputChange}
              placeholder="Enter opening balance"
              aria-describedby="openingBalance-error"
              className={cn(
                "mt-1 text-sm rounded-lg shadow-sm",
                errors.openingBalance && "border-red-500"
              )}
            />
            {errors.openingBalance && (
              <p
                id="openingBalance-error"
                className="text-xs text-red-500 mt-1"
                role="alert"
              >
                {errors.openingBalance}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="cashInHand"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cash in Hand ({currency})
            </Label>
            <Input
              id="cashInHand"
              name="cashInHand"
              type="number"
              value={formData.cashInHand}
              onChange={handleInputChange}
              placeholder="Enter cash in hand"
              aria-describedby="cashInHand-error"
              className={cn(
                "mt-1 text-sm rounded-lg shadow-sm",
                errors.cashInHand && "border-red-500"
              )}
            />
            {errors.cashInHand && (
              <p
                id="cashInHand-error"
                className="text-xs text-red-500 mt-1"
                role="alert"
              >
                {errors.cashInHand}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="closingBalance"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Closing Balance ({currency})
            </Label>
            <Input
              id="closingBalance"
              name="closingBalance"
              type="number"
              value={formData.closingBalance}
              onChange={handleInputChange}
              placeholder="Enter closing balance"
              aria-describedby="closingBalance-error"
              className={cn(
                "mt-1 text-sm rounded-lg shadow-sm",
                errors.closingBalance && "border-red-500"
              )}
            />
            {errors.closingBalance && (
              <p
                id="closingBalance-error"
                className="text-xs text-red-500 mt-1"
                role="alert"
              >
                {errors.closingBalance}
              </p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg shadow-sm px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm px-4 py-2"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashBalanceModal;
