import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface SavingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: any;
  onSuccess: () => void;
}

const SavingsDialog = ({ open, onOpenChange, goal, onSuccess }: SavingsDialogProps) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    icon: "",
    color: ""
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        setFormData({
          name: goal.name,
          description: goal.description || "",
          targetAmount: goal.target.toString(),
          currentAmount: goal.current.toString(),
          targetDate: goal.targetDate.split("T")[0],
          icon: goal.icon || "",
          color: goal.color || ""
        });
      } else {
        setFormData({
          name: "",
          description: "",
          targetAmount: "",
          currentAmount: "0",
          targetDate: "",
          icon: "",
          color: ""
        });
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      targetDate: formData.targetDate,
      icon: formData.icon || "🎯",
      color: formData.color || "#3B82F6"
    };

    try {
      if (goal) {
        await api.put(`/api/savings/${goal.id}`, payload);
        toast({ title: "Savings goal updated successfully" });
      } else {
        await api.post("/api/savings", payload);
        toast({ title: "Savings goal created successfully" });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save goal",
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
          <DialogTitle>{goal ? "Edit Savings Goal" : "Create Savings Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Current Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Date</Label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon (Optional)</Label>
              <Input
                placeholder="e.g., ✈️ 🚗 🏦 💍"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Color (Optional)</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : goal ? "Update" : "Create"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsDialog;
