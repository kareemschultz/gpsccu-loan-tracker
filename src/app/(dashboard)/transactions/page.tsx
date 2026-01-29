"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  merchant: string | null;
  date: string;
  notes: string | null;
  isRecurring: boolean;
  category: Category | null;
  account: Account | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    description: "",
    merchant: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    categoryId: "",
    accountId: "",
    toAccountId: "",
    isRecurring: false,
    recurringFrequency: "monthly",
  });

  const fetchData = () => {
    Promise.all([
      fetch("/api/transactions?limit=100").then((r) => r.json()),
      fetch("/api/transactions/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([txns, cats, accts]) => {
      setTransactions(txns);
      setCategories(cats);
      setAccounts(accts);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({
      type: "expense", amount: "", description: "", merchant: "",
      date: new Date().toISOString().split("T")[0], notes: "",
      categoryId: "", accountId: "", toAccountId: "",
      isRecurring: false, recurringFrequency: "monthly",
    });
  };

  const handleSubmit = async () => {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
        accountId: form.accountId || null,
        toAccountId: form.toAccountId || null,
      }),
    });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);

  const filteredCategories = categories.filter((c) => {
    if (form.type === "income") return c.type === "income" || c.type === "both";
    if (form.type === "expense") return c.type === "expense" || c.type === "both";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Transactions</h1></div>
        <Card><CardContent className="py-12"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track your income, expenses, and transfers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}>➕ Add Transaction</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
              <DialogDescription>Record income, expense, or transfer</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {(["income", "expense", "transfer"] as const).map((t) => (
                  <Button key={t} variant={form.type === t ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, type: t })}>
                    {t === "income" ? "💰" : t === "expense" ? "💸" : "🔄"} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Input placeholder="e.g., Weekly groceries" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {form.type !== "transfer" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Merchant</Label>
                    <Input placeholder="e.g., Massy Stores" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
                  </div>
                </div>
              )}

              <div className={`grid ${form.type === "transfer" ? "grid-cols-2" : ""} gap-4`}>
                <div className="grid gap-2">
                  <Label>{form.type === "transfer" ? "From Account" : "Account"}</Label>
                  <Select value={form.accountId} onValueChange={(v) => v && setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.type === "transfer" && (
                  <div className="grid gap-2">
                    <Label>To Account</Label>
                    <Select value={form.toAccountId} onValueChange={(v) => v && setForm({ ...form, toAccountId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {accounts.filter((a) => a.id !== form.accountId).map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.amount || !form.date}>Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${totalIncome - totalExpenses >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="transfer">Transfers</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Start recording your income and expenses to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      txn.type === "income" ? "bg-green-100 dark:bg-green-950 text-green-600" :
                      txn.type === "expense" ? "bg-red-100 dark:bg-red-950 text-red-600" :
                      "bg-blue-100 dark:bg-blue-950 text-blue-600"
                    }`}>
                      {txn.type === "income" ? "💰" : txn.type === "expense" ? "💸" : "🔄"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {txn.description || txn.merchant || txn.type}
                        {txn.category && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">{txn.category.name}</Badge>
                        )}
                        {txn.isRecurring && (
                          <Badge variant="outline" className="ml-1 text-[10px]">🔁</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {txn.merchant && ` • ${txn.merchant}`}
                        {txn.account && ` • ${txn.account.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${
                      txn.type === "income" ? "text-green-600 dark:text-green-400" :
                      txn.type === "expense" ? "text-red-600 dark:text-red-400" : ""
                    }`}>
                      {txn.type === "income" ? "+" : txn.type === "expense" ? "−" : ""}
                      {formatCurrency(parseFloat(txn.amount))}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(txn.id)}>
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
