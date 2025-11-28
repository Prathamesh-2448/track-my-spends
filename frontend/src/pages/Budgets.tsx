import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import BudgetDialog from '@/components/BudgetDialog';
import DeleteDialog from "@/components/DeleteDialog";


const Budgets = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);


  const fetchBudgets = async () => {
    try {
      const response = await api.get('/api/budgets');

      const formatted = response.data.data.map((b: any) => ({
        id: b._id,
        category: b.category?.name || "",
        categoryId: b.category?._id || "",
        amount: b.amount,
        period: b.period,
        startDate: b.startDate,
        endDate: b.endDate,
        alertThreshold: b.alertThreshold,
        spent: b.spent,
        percentage: b.percentage,
        remaining: b.remaining,
        isOverBudget: b.isOverBudget,
        isNearLimit: b.isNearLimit,
      }));

      setBudgets(formatted);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/budgets/${id}`);
      fetchBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">Set and track your spending limits</p>
          </div>
          <Button onClick={() => { setEditingBudget(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const pct = b.percentage ?? 0;
            const over = b.isOverBudget;

            return (
              <Card key={b.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{b.category}</CardTitle>
                    <div className="text-right text-sm text-muted-foreground">
                      {user?.currency} {b.spent?.toLocaleString()} / {b.amount?.toLocaleString()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Progress
                      value={Math.min(pct, 100)}
                      className={over ? "bg-destructive/20" : ""}
                    />
                    <p className={`text-sm ${over ? "text-destructive" : "text-muted-foreground"}`}>
                      {pct.toFixed(0)}% used {over && "- Over budget!"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingBudget(b);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                      setSelectedBudgetId(b.id);
                      setDeleteOpen(true);
                    }}
                    >
                      Delete
                    </Button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>

        {budgets.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No budgets set. Create your first budget to start tracking!
          </div>
        )}

        <BudgetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          budget={editingBudget}
          onSuccess={() => {
            fetchBudgets();
            setDialogOpen(false);
            setEditingBudget(null);
          }}
        />

      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
        loading={false}
        onConfirm={async () => {
          if (!selectedBudgetId) return;
          await handleDelete(selectedBudgetId);
          setDeleteOpen(false);
          setSelectedBudgetId(null);
          fetchBudgets();
        }}
      />
    </DashboardLayout>
  );
};

export default Budgets;
