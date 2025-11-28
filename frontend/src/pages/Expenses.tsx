import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search } from "lucide-react";
import api from "@/lib/api";
import ExpenseDialog from "@/components/ExpenseDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import ExpensesList from "@/components/ExpenseList";


const ExpensesPage = () => {
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [monthTotal, setMonthTotal] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageTotal, setPageTotal] = useState(0);


  useEffect(() => {
    const delay = setTimeout(() => {
    fetchExpenses();
    fetchCategories();
  },300);
  return () => clearTimeout(delay);
  }, [search, category, startDate, endDate]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data.data || res.data);
    } catch (error) {
      console.log("Failed to fetch categories", error);
    }
  };

  const fetchExpenses = async () => {
  try {
    const res = await api.get("/api/expenses", {
      params: {
        limit: 100,
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
    });

    const data = res.data.data;

    const formatted = res.data.data.map((x: any) => ({
      id: x._id,
      description: x.description,
      amount: x.amount,
      date: x.date,
      paymentMethod: x.paymentMethod,
      notes: x.notes,
      category: x.category?.name,
      categoryIcon: x.category?.icon,
      categoryColor: x.category?.color,
    }));

    // === INSIGHT CALCULATIONS ===
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthExpenses = data.filter((x: any) => {
      const d = new Date(x.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    setMonthTotal(thisMonthExpenses.reduce((sum: number, x: any) => sum + x.amount, 0));
    setTotalCount(data.length);
    setPageTotal(formatted.reduce((sum, x) => sum + x.amount, 0));


    setExpenses(formatted);
  } catch (error) {
    console.log("Failed to fetch expenses", error);
  } finally {
    setLoading(false);
  }
};


  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/api/expenses/${id}`);
      toast({ title: "Expense deleted" });
      fetchExpenses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
  <div className="flex flex-col h-[calc(100vh-80px)] space-y-6">

    {/* HEADER (fixed) */}
    <div className="flex items-center justify-between shrink-0">
      <h1 className="text-3xl font-bold">Expenses</h1>
      <Button
        onClick={() => {
          setEditingExpense(null);
          setDialogOpen(true);
        }}
      >
        + Add Expense
      </Button>
    </div>

    {/* INSIGHT CARDS (fixed) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      <Card className="flex items-center gap-4 p-4">
        <div className="p-3 bg-blue-100 rounded-xl text-2xl">💰</div>
        <div>
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">
            {user?.currency} {monthTotal.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-4">
        <div className="p-3 bg-green-100 rounded-xl text-2xl">📊</div>
        <div>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-4">
        <div className="p-3 bg-yellow-100 rounded-xl text-2xl">💳</div>
        <div>
          <p className="text-sm text-muted-foreground">Current Page</p>
          <p className="text-2xl font-bold">
            {user?.currency} {pageTotal.toLocaleString()}
          </p>
        </div>
      </Card>
    </div>

    {/* SCROLLABLE AREA */}
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">

      {/* FILTERS */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap gap-4 items-center border sticky top-0 z-10">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[160px]"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <Input
          type="date"
          className="w-[160px]"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setCategory("all");
            setStartDate("");
            setEndDate("");
          }}
        >
          Reset
        </Button>
      </div>

      {/* SCROLLABLE EXPENSE LIST */}
      <ExpensesList
        expenses={expenses}
        currency={user?.currency}
        onEdit={(expense) => {
          setEditingExpense(expense);
          setDialogOpen(true);
        }}
        onDelete={deleteExpense}
      />

    </div>

    {/* DIALOG */}
    <ExpenseDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      expense={editingExpense}
      onSuccess={() => {
        fetchExpenses();
        setDialogOpen(false);
        setEditingExpense(null);
      }}
    />
  </div>
</DashboardLayout>

  );
};

export default ExpensesPage;
