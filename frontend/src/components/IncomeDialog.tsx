import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IncomeDialog = ({ open, onOpenChange }: IncomeDialogProps) => {
  const { user, updateIncome } = useAuth();
  const [income, setIncome] = useState("");

  useEffect(() => {
    if (open && user) {
      setIncome(user.income?.toString() || "");
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateIncome(Number(income));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Income</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income</Label>
            <Input
              id="income"
              type="number"
              placeholder="Enter your income"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncomeDialog;
