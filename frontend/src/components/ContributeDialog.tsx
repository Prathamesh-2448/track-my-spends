import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
  onSuccess: () => void;
}

const ContributeDialog = ({ open, onOpenChange, goalId, onSuccess }: ContributeDialogProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId) return;

    setLoading(true);

    try {
      await api.post(`/api/savings/${goalId}/contribute`, {
        amount: parseFloat(amount),
      });

      toast({ title: "Contribution added successfully" });
      onSuccess();
      onOpenChange(false);
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add contribution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContributeDialog;