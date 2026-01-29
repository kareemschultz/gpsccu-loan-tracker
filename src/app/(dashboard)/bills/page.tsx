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
import { formatCurrency } from "@/lib/constants";

interface Bill {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  frequency: string;
  isAutoPay: boolean;
  isPaid: boolean;
  lastPaidDate: string | null;
  icon: string;
  color: string;
  notes: string | null;
  isActive: boolean;
  category: { name: string } | null;
  account: { name: string } | null;
}

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

const BILL_ICONS = [
  { value: "🏠", label: "Rent/Mortgage" },
  { value: "⚡", label: "Electricity" },
  { value: "💧", label: "Water" },
  { value: "📱", label: "Phone" },
  { value: "🌐", label: "Internet" },
  { value: "📺", label: "Streaming" },
  { value: "🚗", label: "Car" },
  { value: "🛡️", label: "Insurance" },
  { value: "💳", label: "Credit Card" },
  { value: "📦", label: "Other" },
];

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [form, setForm] = useState({
    name: "", amount: "", dueDate: "", frequency: "monthly",
    categoryId: "", accountId: "", isAutoPay: false,
    icon: "📦", color: "#ef4444", notes: "",
  });

  const fetchData = () => {
    Promise.all([
      fetch("/api/bills").then((r) => r.json()),
      fetch("/api/transactions/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([b, c, a]) => { setBills(b); setCategories(c); setAccounts(a); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", amount: "", dueDate: "", frequency: "monthly", categoryId: "", accountId: "", isAutoPay: false, icon: "📦", color: "#ef4444", notes: "" });
    setEditingBill(null);
  };

  const handleSubmit = async () => {
    const method = editingBill ? "PUT" : "POST";
    const url = editingBill ? `/api/bills/${editingBill.id}` : "/api/bills";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
        accountId: form.accountId || null,
      }),
    });

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleMarkPaid = async (id: string) => {
    await fetch(`/api/bills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markPaid: true }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setForm({
      name: bill.name, amount: bill.amount, dueDate: bill.dueDate,
      frequency: bill.frequency, categoryId: "", accountId: "",
      isAutoPay: bill.isAutoPay, icon: bill.icon, color: bill.color,
      notes: bill.notes || "",
    });
    setDialogOpen(true);
  };

  const today = new Date().toISOString().split("T")[0];
  const overdueBills = bills.filter((b) => b.dueDate < today && b.isActive);
  const upcomingBills = bills.filter((b) => {
    const due = new Date(b.dueDate);
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    return b.dueDate >= today && due <= next7 && b.isActive;
  });
  const futureBills = bills.filter((b) => {
    const due = new Date(b.dueDate);
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    return due > next7 && b.isActive;
  });

  const totalMonthly = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => {
      const amount = parseFloat(b.amount);
      switch (b.frequency) {
        case "weekly": return sum + amount * 4.33;
        case "biweekly": return sum + amount * 2.17;
        case "monthly": return sum + amount;
        case "quarterly": return sum + amount / 3;
        case "semi_annual": return sum + amount / 6;
        case "annual": return sum + amount / 12;
        default: return sum + amount;
      }
    }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Bills & Recurring</h1></div>
        <Card><CardContent className="py-12"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>
      </div>
    );
  }

  const renderBillCard = (bill: Bill, isOverdue = false) => {
    const daysUntil = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / 86400000);

    return (
      <Card key={bill.id} className={`${isOverdue ? "border-red-500/50" : ""}`}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: bill.color + "20" }}>
              {bill.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {bill.name}
                {bill.isAutoPay && <Badge variant="secondary" className="ml-2 text-[10px]">Auto</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(bill.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" · "}
                {FREQUENCIES.find((f) => f.value === bill.frequency)?.label || bill.frequency}
                {isOverdue && <span className="text-red-500 ml-1">({Math.abs(daysUntil)}d overdue)</span>}
                {!isOverdue && daysUntil <= 7 && daysUntil >= 0 && (
                  <span className="text-amber-500 ml-1">({daysUntil === 0 ? "Today" : `${daysUntil}d`})</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(parseFloat(bill.amount))}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleMarkPaid(bill.id)}>
              ✅ Paid
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(bill)}>✏️</Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(bill.id)}>×</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills & Recurring</h1>
          <p className="text-muted-foreground">Track upcoming bills and recurring payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}>📋 Add Bill</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBill ? "Edit Bill" : "Add Bill"}</DialogTitle>
              <DialogDescription>Track a recurring bill or subscription</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Bill Name</Label>
                <Input placeholder="e.g., GPL Electricity" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => v && setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Account</Label>
                  <Select value={form.accountId} onValueChange={(v) => v && setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {BILL_ICONS.map((ic) => (
                    <button key={ic.value} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${form.icon === ic.value ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`} onClick={() => setForm({ ...form, icon: ic.value })} title={ic.label}>
                      {ic.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.name || !form.amount || !form.dueDate}>
                {editingBill ? "Save Changes" : "Add Bill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Bills Total</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatCurrency(totalMonthly)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{bills.length} active bills</p></CardContent>
        </Card>
        <Card className={overdueBills.length > 0 ? "border-red-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${overdueBills.length > 0 ? "text-red-600" : ""}`}>
              {overdueBills.length}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">
            {overdueBills.length > 0 ? `${formatCurrency(overdueBills.reduce((s, b) => s + parseFloat(b.amount), 0))} past due` : "All caught up!"}
          </p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due This Week</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-amber-600 dark:text-amber-400">{upcomingBills.length}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">
            {upcomingBills.length > 0 ? formatCurrency(upcomingBills.reduce((s, b) => s + parseFloat(b.amount), 0)) : "Nothing due"}
          </p></CardContent>
        </Card>
      </div>

      {/* Bill Lists */}
      {bills.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No bills yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">Add your recurring bills to get reminders and track payments.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {overdueBills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">⚠️ Overdue</h2>
              <div className="space-y-2">{overdueBills.map((b) => renderBillCard(b, true))}</div>
            </div>
          )}
          {upcomingBills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">📅 Due This Week</h2>
              <div className="space-y-2">{upcomingBills.map((b) => renderBillCard(b))}</div>
            </div>
          )}
          {futureBills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">📆 Upcoming</h2>
              <div className="space-y-2">{futureBills.map((b) => renderBillCard(b))}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
