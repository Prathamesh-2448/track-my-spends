import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: { category: string; amount: number; color: string }[];
  recentExpenses: any[];
  budgetAlerts: any[];
  savingsGoals: any[];
  monthlyTrends: { month: string; expenses: number; income: number }[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const hasNoExpenses =
    dashboardData?.recentExpenses?.length === 0 &&
    dashboardData?.categoryBreakdown?.length === 0 &&
    dashboardData?.monthlyTrends?.length === 0;

const fetchDashboardData = async () => {
  try {
    const response = await api.get('/api/dashboard');
    const alerts = await api.get('/api/budgets/alerts');
    const d = response.data.data; 

    setDashboardData({
    totalIncome: d.overview.income,
    totalExpenses: d.expenses.monthly,
    balance: d.overview.balance,

    categoryBreakdown: d.expenses.categoryBreakdown?.map(x => ({
      category: x.name,
      amount: x.total,
      color: x.color
    })) ?? [],

    recentExpenses: d.expenses.recentExpenses ?? [],

    savingsGoals: d.savings.goals?.map((g: any) => ({
      id: g._id,
      name: g.name,
      description: g.description,
      target: g.targetAmount,          // backend name
      current: g.currentAmount,        // backend name
      percentage: g.progressPercentage // backend name
    })) ?? [],

    
    monthlyTrends: d.trends.monthlyData?.map(x => ({
      month: x.month,
      expenses: x.total,
      income: 0
    })) ?? [],

    budgetAlerts: alerts.data.data   // <-- ONLY THIS, correct alerts structure
  });
  


  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    setLoading(false);
  }
};



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  const categoryChartData = {
    labels: dashboardData?.categoryBreakdown?.map(cat => cat.category) || [],
    datasets: [{
      data: dashboardData?.categoryBreakdown?.map(cat => cat.amount) || [],
      backgroundColor: dashboardData?.categoryBreakdown.map(cat => cat.color) || [],
      borderWidth: 0,
    }],
  };

  const trendsChartData = {
    labels: dashboardData?.monthlyTrends?.map(t => t.month) || [],
    datasets: [
      {
        label: 'Expenses',
        data: dashboardData?.monthlyTrends?.map(t => t.expenses) || [],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        tension: 0.3,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground">Here's your financial overview</p>
        </div>
       

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <Wallet className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {user?.currency} {dashboardData?.totalIncome?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {user?.currency} {dashboardData?.totalExpenses?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.currency} {dashboardData?.balance.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* If user has no expenses, show "Add your first expense" */}
        {/* If user has no expenses, show CTA */}
{hasNoExpenses ? (
  <Card className="p-6 text-center">
    <h2 className="text-xl font-semibold mb-2">You haven't added any expenses yet</h2>
    <p className="text-muted-foreground mb-4">
      Start by adding your first expense to unlock insights and charts.
    </p>
    <Button onClick={() => (window.location.href = "/expenses")}>
      + Add Your First Expense
    </Button>
  </Card>
) : (
  /* Charts + savings inside scrollable container */
  <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
    {/* Budget Alerts */}
        {dashboardData?.budgetAlerts?.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Budget Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.budgetAlerts.map((alert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">

                    <span className="font-medium">
                      {alert.budget.category.name}
                    </span>

                    <span
                      className={`text-lg font-semibold flex items-center ${
                        alert.type === "over_budget" ? "text-destructive" : "text-warning"}`}>
                          {alert.percentage}% used
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

    {/* Charts */}
    <div className="grid gap-6 md:grid-cols-2">
      {/* Doughnut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-full flex justify-center">
            <div className="w-[70%] sm:w-[60%] md:w-[60%] lg:w-[60%] xl:w-[50%]">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] md:h-[350px]">
          <Line
            data={trendsChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </CardContent>
      </Card>

    </div>

    {/* Savings Goals */}
    {dashboardData?.savingsGoals?.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Savings Goals
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {dashboardData.savingsGoals.map((goal: any) => (
              <div key={goal.id} className="space-y-2">

                {/* Name + current/target row */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.currency} {goal.current.toLocaleString()} /
                    {goal.target.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>

              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

  </div>
)}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
