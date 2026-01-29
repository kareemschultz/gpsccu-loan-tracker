"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";

interface FinanceSummary {
  netWorth: number;
  assets: number;
  liabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  recentTransactions: {
    id: string;
    type: string;
    amount: string;
    description: string | null;
    merchant: string | null;
    date: string;
    category: { name: string; color: string } | null;
    account: { name: string } | null;
  }[];
  upcomingBills: {
    id: string;
    name: string;
    amount: string;
    dueDate: string;
    icon: string;
    isAutoPay: boolean;
  }[];
  overdueBills: number;
  goals: {
    id: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    icon: string;
    color: string;
  }[];
  currentBudget: {
    items: {
      id: string;
      budgeted: string;
      spent: string;
      category: { name: string; color: string } | null;
    }[];
  } | null;
  accountCount: number;
}

export function FinanceDashboardWidgets() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finance/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="py-8"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data || (data.accountCount === 0 && data.recentTransactions.length === 0 && data.goals.length === 0)) {
    return null; // No finance data yet
  }

  return (
    <div className="space-y-6">
      {/* Finance Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth */}
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${data.netWorth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(data.netWorth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Assets: {formatCurrency(data.assets)}</span>
              <span>Debt: {formatCurrency(data.liabilities)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Cash Flow */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Cash Flow</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${data.cashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {data.cashFlow >= 0 ? "+" : ""}{formatCurrency(data.cashFlow)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-green-600">↑ {formatCurrency(data.monthlyIncome)}</span>
              <span className="text-red-600">↓ {formatCurrency(data.monthlyExpenses)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className={data.overdueBills > 0 ? "border-red-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Bills This Week</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data.upcomingBills.length}
              {data.overdueBills > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px]">{data.overdueBills} overdue</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.upcomingBills.length > 0
                ? `${formatCurrency(data.upcomingBills.reduce((s, b) => s + parseFloat(b.amount), 0))} due`
                : "No bills due soon"}
            </p>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Savings Goals</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{data.goals.length} active</CardTitle>
          </CardHeader>
          <CardContent>
            {data.goals.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.goals.reduce((s, g) => s + parseFloat(g.currentAmount), 0))} saved of{" "}
                {formatCurrency(data.goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Overview */}
        {data.currentBudget && data.currentBudget.items.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Budget Overview</CardTitle>
                  <CardDescription>This month&apos;s spending by category</CardDescription>
                </div>
                <Link href="/budgets" className={buttonVariants({ variant: "ghost", size: "sm" })}>View All →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.currentBudget.items
                .sort((a, b) => parseFloat(b.budgeted) - parseFloat(a.budgeted))
                .slice(0, 5)
                .map((item) => {
                  const budgeted = parseFloat(item.budgeted);
                  const spent = parseFloat(item.spent || "0");
                  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
                  const over = spent > budgeted;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.category?.name || "Unknown"}</span>
                        <span className={`tabular-nums ${over ? "text-red-600" : "text-muted-foreground"}`}>
                          {formatCurrency(spent)} / {formatCurrency(budgeted)}
                        </span>
                      </div>
                      <Progress value={pct} className={`h-2 ${over ? "[&>div]:bg-red-500" : ""}`} />
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bills */}
        {data.upcomingBills.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming Bills</CardTitle>
                  <CardDescription>Due in the next 7 days</CardDescription>
                </div>
                <Link href="/bills" className={buttonVariants({ variant: "ghost", size: "sm" })}>View All →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bill.icon}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {bill.name}
                        {bill.isAutoPay && <Badge variant="secondary" className="ml-1 text-[10px]">Auto</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(bill.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(parseFloat(bill.amount))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Transactions */}
      {data.recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </div>
              <Link href="/transactions" className={buttonVariants({ variant: "ghost", size: "sm" })}>View All →</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentTransactions.slice(0, 8).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                      txn.type === "income" ? "bg-green-100 dark:bg-green-950 text-green-600" :
                      txn.type === "expense" ? "bg-red-100 dark:bg-red-950 text-red-600" :
                      "bg-blue-100 dark:bg-blue-950 text-blue-600"
                    }`}>
                      {txn.type === "income" ? "💰" : txn.type === "expense" ? "💸" : "🔄"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {txn.description || txn.merchant || txn.type}
                        {txn.category && <Badge variant="secondary" className="ml-1 text-[10px]">{txn.category.name}</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {txn.account && ` · ${txn.account.name}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    txn.type === "income" ? "text-green-600 dark:text-green-400" :
                    txn.type === "expense" ? "text-red-600 dark:text-red-400" : ""
                  }`}>
                    {txn.type === "income" ? "+" : txn.type === "expense" ? "−" : ""}
                    {formatCurrency(parseFloat(txn.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Goals Progress */}
      {data.goals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Savings Goals</CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </div>
              <Link href="/goals" className={buttonVariants({ variant: "ghost", size: "sm" })}>View All →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.goals.map((goal) => {
              const target = parseFloat(goal.targetAmount);
              const current = parseFloat(goal.currentAmount);
              const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{goal.icon}</span>
                      <span className="text-sm font-medium">{goal.name}</span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(current)} / {formatCurrency(target)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
