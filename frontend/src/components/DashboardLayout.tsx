import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  PiggyBank, 
  Tag, 
  LogOut, 
  Wallet,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import IncomeDialog from './IncomeDialog';

interface DashboardLayoutProps {
  children: ReactNode;
}


const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);

  const navigate = useNavigate();


  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/savings', icon: PiggyBank, label: 'Savings' },
    { path: '/categories', icon: Tag, label: 'Categories' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-6 cursor-pointer"
  onClick={() => navigate("/")}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold">Track My Spends</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => setIncomeDialogOpen(true)}>
              Change Income
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Track My Spends</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background pt-16">
            <nav className="space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Button variant="outline" className="w-full justify-start" onClick={() => setIncomeDialogOpen(true)}>
              Change Income
              </Button>
              <Button variant="outline" className="mt-4 w-full justify-start" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>

      <IncomeDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
      />


      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 pt-20 lg:pt-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
