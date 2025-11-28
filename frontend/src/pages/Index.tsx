import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Target, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="container mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Track My Spends</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6">
        <div className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center text-center">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Wallet className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Take Control of
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Finances
            </span>
          </h1>

          <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
            Track expenses, set budgets, and achieve your savings goals with our intuitive
            expense tracking platform.
          </p>

          <div className="flex gap-4">
            <Link to="/register">
              <Button size="lg" className="text-lg">
                Start Tracking Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
              <TrendingUp className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Track Expenses</h3>
              <p className="text-muted-foreground">
                Easily categorize and monitor all your spending in one place
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
              <Target className="mb-4 h-10 w-10 text-accent" />
              <h3 className="mb-2 text-xl font-semibold">Set Budgets</h3>
              <p className="text-muted-foreground">
                Create category budgets and get alerts when you're overspending
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
              <Shield className="mb-4 h-10 w-10 text-success" />
              <h3 className="mb-2 text-xl font-semibold">Savings Goals</h3>
              <p className="text-muted-foreground">
                Set financial goals and track your progress towards achieving them
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

