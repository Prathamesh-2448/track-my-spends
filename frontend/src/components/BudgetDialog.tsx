import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';


interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: any;
  onSuccess: () => void;
}

const BudgetDialog = ({ open, onOpenChange, budget, onSuccess }: BudgetDialogProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly",
    alertThreshold: "80",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      fetchCategories();

      if (budget) {
        setFormData({
          category: budget.categoryId,
          amount: budget.amount.toString(),
          period: budget.period || "monthly",
          alertThreshold: budget.alertThreshold?.toString() || "80",
          startDate: budget.startDate?.split("T")[0] || new Date().toISOString().split("T")[0],
        });
      } else {
        setFormData({
          category: "",
          amount: "",
          period: "monthly",
          alertThreshold: "80",
          startDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, budget]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      const formatted = response.data.data.map((c: any) => ({
        id: c._id,
        name: c.name
      }));
      setCategories(formatted);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold),
      startDate: formData.startDate
    };

    try {
      if (budget) {
        await api.put(`/api/budgets/${budget.id}`, payload);
        toast({ title: "Budget updated successfully" });
      } else {
        await api.post("/api/budgets", payload);
        toast({ title: "Budget created successfully" });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save budget",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Create Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Budget Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Period</Label>
            <Select
              value={formData.period}
              onValueChange={(value) => setFormData({ ...formData, period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alert Threshold (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : budget ? "Update" : "Create"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetDialog;
