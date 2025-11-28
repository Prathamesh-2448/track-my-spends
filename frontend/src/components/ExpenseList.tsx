import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";

interface ExpenseListProps {
  expenses: any[];
  currency: string;
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
}

const ExpensesList = ({ expenses, currency, onEdit, onDelete }: ExpenseListProps) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    if (selectedId) {
      onDelete(selectedId);
    }
    setOpenDelete(false);
    setSelectedId(null);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No expenses found.
      </div>
    );
  }

  return (
    <>
      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Delete Expense?"
        message="This action cannot be undone."
        onConfirm={confirmDelete}
      />

      <div className="space-y-4">
        {expenses.map((e) => (
          <Card key={e.id} className="border rounded-xl">
            <CardContent className="p-4 flex items-center justify-between">
              
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: e.categoryColor + "22" }}
                >
                  {e.categoryIcon}
                </div>

                <div>
                  <h3 className="font-semibold">{e.description}</h3>
                  <p className="text-sm text-muted-foreground">{e.category}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{new Date(e.date).toLocaleDateString()}</span>
                    <span className="ml-2 capitalize">{e.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-lg font-bold">
                  {currency} {e.amount.toLocaleString()}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(e)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClick(e.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ExpensesList;
