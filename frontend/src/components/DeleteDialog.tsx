import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;               // Optional: default = "Delete Item"
  message?: string;             // Optional: default warning message
  confirmText?: string;         // Optional: default = "Delete"
  loading?: boolean;

  onConfirm: () => void;        // Action when user confirms
}

export default function DeleteDialog({
  open,
  onOpenChange,
  title = "Delete Item",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  confirmText = "Delete",
  loading = false,
  onConfirm
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">{message}</p>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
