import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import SavingsDialog from '@/components/SavingsDialog';
import { toast } from '@/hooks/use-toast';
import ContributeDialog from '@/components/ContributeDialog'
import DeleteDialog from "@/components/DeleteDialog";

const Savings = () => {
  const { user } = useAuth();
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchSavings = async () => {
    try {
      const response = await api.get('/api/savings');

      const formatted = response.data.data.map((goal: any) => ({
        id: goal._id,
        name: goal.name,
        description: goal.description || "",
        target: goal.targetAmount,
        current: goal.currentAmount,
        targetDate: goal.targetDate,
        progress: goal.progressPercentage,
        remaining: goal.remainingAmount,
        daysRemaining: goal.daysRemaining,
        icon: goal.icon,
        color: goal.color,
        isCompleted: goal.isCompleted,
      }));

      setSavings(formatted);
    } catch (error) {
      console.error('Failed to fetch savings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContributeClick = (id: string) => {
  setSelectedGoalId(id);
  setContributeOpen(true);
};

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/savings/${id}`);
      toast({ title: 'Savings goal deleted' });
      fetchSavings();
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
    }
  };

  useEffect(() => {
    fetchSavings();
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
            <h1 className="text-3xl font-bold">Savings Goals</h1>
            <p className="text-muted-foreground">Track your progress towards financial goals</p>
          </div>
          <Button onClick={() => { setEditingGoal(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {savings.map((goal) => {
            const percentage = goal.progress ?? 0;

            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{goal.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {user?.currency} {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                      </span>
                    </div>

                    <Progress value={percentage} />

                    <p className="text-sm text-muted-foreground">
                      {percentage.toFixed(0)}% complete — 
                      {user?.currency} {goal.remaining.toLocaleString()} remaining
                    </p>
                  </div>

                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}

                  <div className="flex gap-2">
                    <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleContributeClick(goal.id)}
                    >
                    <TrendingUp className="mr-1 h-3 w-3" />
                      Contribute
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingGoal(goal); setDialogOpen(true); }}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                      setSelectedGoalId(goal.id);
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

        {savings.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No savings goals yet. Create your first goal to start saving!
          </div>
        )}

        <SavingsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          goal={editingGoal}
          onSuccess={() => {
            fetchSavings();
            setDialogOpen(false);
            setEditingGoal(null);
          }}
        />
        <ContributeDialog
          open={contributeOpen}
          onOpenChange={setContributeOpen}
          goalId={selectedGoalId}
          onSuccess={fetchSavings}
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
                if (!selectedGoalId) return;
                await handleDelete(selectedGoalId);
                setDeleteOpen(false);
                setSelectedGoalId(null);
                fetchSavings();
              }}
            />
    </DashboardLayout>
  );
};
export default Savings;
