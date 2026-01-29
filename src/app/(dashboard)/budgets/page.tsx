"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/constants";

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  budgeted: string;
  spent: string;
  rollover: boolean;
  category: BudgetCategory;
}

interface Budget {
  id: string;
  month: number;
  year: number;
  totalIncome: string;
  items: BudgetItem[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Housing": "🏠", "Food & Groceries": "🛒", "Transportation": "🚗",
  "Utilities": "⚡", "Entertainment": "🎬", "Healthcare": "❤️",
  "Education": "📚", "Shopping": "🛍️", "Personal Care": "💆",
  "Insurance": "🛡️", "Savings & Debt": "🐷", "Other": "📦",
};

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [income, setIncome] = useState("");
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [spendDialogOpen, setSpendDialogOpen] = useState(false);
  const [spendItem, setSpendItem] = useState<BudgetItem | null>(null);
  const [spendAmount, setSpendAmount] = useState("");

  const fetchBudget = () => {
    setLoading(true);
    fetch(`/api/budgets?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setBudget(data.budget || null);
        setCategories(data.categories || []);
        if (data.budget) {
          setIncome(data.budget.totalIncome || "0");
          const allocs: Record<string, string> = {};
          data.budget.items.forEach((item: BudgetItem) => {
            allocs[item.categoryId] = item.budgeted;
          });
          setAllocations(allocs);
        } else {
          setIncome("");
          setAllocations({});
        }
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBudget(); }, [month, year]);

  const totalBudgeted = useMemo(() =>
    Object.values(allocations).reduce((sum, v) => sum + parseFloat(v || "0"), 0)
  , [allocations]);

  const totalSpent = useMemo(() =>
    budget?.items.reduce((sum, item) => sum + parseFloat(item.spent || "0"), 0) || 0
  , [budget]);

  const incomeAmount = parseFloat(income || "0");
  const remaining = incomeAmount - totalBudgeted;

  const handleSaveBudget = async () => {
    const items = categories.map((cat) => ({
      categoryId: cat.id,
      budgeted: parseFloat(allocations[cat.id] || "0"),
      rollover: false,
    })).filter((item) => item.budgeted > 0);

    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, totalIncome: incomeAmount, items }),
    });

    setEditMode(false);
    fetchBudget();
  };

  const handleRecordSpend = async () => {
    if (!spendItem || !spendAmount) return;
    const newSpent = parseFloat(spendItem.spent || "0") + parseFloat(spendAmount);
    await fetch(`/api/budgets/${spendItem.budgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: spendItem.id, spent: newSpent }),
    });
    setSpendDialogOpen(false);
    setSpendAmount("");
    setSpendItem(null);
    fetchBudget();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Budgets</h1></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (<Card key={i}><CardContent className="py-8"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Envelope-style budgeting — allocate income to categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => v && setMonth(parseInt(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => v && setYear(parseInt(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatCurrency(incomeAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budgeted</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatCurrency(totalBudgeted)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Spent</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={remaining < 0 ? "border-red-500/50" : "border-green-500/50"}>
          <CardHeader className="pb-2">
            <CardDescription>Unallocated</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(remaining)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Edit/Create Budget Mode */}
      {(editMode || !budget) && (
        <Card>
          <CardHeader>
            <CardTitle>{budget ? "Edit Budget" : "Create Budget"} — {MONTHS[month - 1]} {year}</CardTitle>
            <CardDescription>Set your monthly income and allocate to categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 max-w-xs">
              <Label>Monthly Income</Label>
              <Input type="number" placeholder="0" value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>

            <div className="space-y-3">
              <Label>Category Allocations</Label>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{CATEGORY_ICONS[cat.name] || "📦"}</span>
                  <span className="text-sm font-medium w-36 truncate">{cat.name}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-32"
                    value={allocations[cat.id] || ""}
                    onChange={(e) => setAllocations({ ...allocations, [cat.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveBudget} disabled={incomeAmount <= 0}>
                💾 Save Budget
              </Button>
              {budget && (
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Items (View Mode) */}
      {budget && !editMode && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>✏️ Edit Budget</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {budget.items
              .sort((a, b) => parseFloat(b.budgeted) - parseFloat(a.budgeted))
              .map((item) => {
                const budgeted = parseFloat(item.budgeted);
                const spent = parseFloat(item.spent || "0");
                const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
                const overBudget = spent > budgeted;

                return (
                  <Card key={item.id} className={overBudget ? "border-red-500/50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{CATEGORY_ICONS[item.category?.name] || "📦"}</span>
                          <CardTitle className="text-base">{item.category?.name || "Unknown"}</CardTitle>
                        </div>
                        {overBudget && <Badge variant="destructive" className="text-[10px]">Over Budget</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(spent)} of {formatCurrency(budgeted)}
                        </span>
                        <span className={`font-medium tabular-nums ${overBudget ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(budgeted - spent)} left
                        </span>
                      </div>
                      <Progress value={pct} className={`h-2 ${overBudget ? "[&>div]:bg-red-500" : ""}`} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { setSpendItem(item); setSpendDialogOpen(true); }}
                      >
                        ➕ Record Spending
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </>
      )}

      {/* Spend Dialog */}
      <Dialog open={spendDialogOpen} onOpenChange={(o) => { setSpendDialogOpen(o); if (!o) { setSpendItem(null); setSpendAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Spending</DialogTitle>
            <DialogDescription>
              How much did you spend on {spendItem?.category?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} autoFocus />
            </div>
            {spendItem && (
              <p className="text-sm text-muted-foreground">
                Currently spent: {formatCurrency(parseFloat(spendItem.spent || "0"))} of {formatCurrency(parseFloat(spendItem.budgeted))}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleRecordSpend} disabled={!spendAmount}>Add Spending</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
