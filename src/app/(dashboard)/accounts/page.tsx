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

interface Account {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  balance: string;
  color: string;
  icon: string;
  isActive: boolean;
  includeInNetWorth: boolean;
  notes: string | null;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", emoji: "🏦" },
  { value: "savings", label: "Savings", emoji: "💰" },
  { value: "credit_card", label: "Credit Card", emoji: "💳" },
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "investment", label: "Investment", emoji: "📈" },
  { value: "loan", label: "Loan", emoji: "🏷️" },
  { value: "other", label: "Other", emoji: "📁" },
];

const COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#6366f1",
];

function getTypeEmoji(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.emoji || "📁";
}

function getTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;
}

function isLiability(type: string) {
  return ["credit_card", "loan"].includes(type);
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({
    name: "", type: "checking", institution: "", balance: "", color: "#3b82f6", notes: "",
  });

  const fetchAccounts = () => {
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const resetForm = () => {
    setForm({ name: "", type: "checking", institution: "", balance: "", color: "#3b82f6", notes: "" });
    setEditingAccount(null);
  };

  const handleSubmit = async () => {
    const method = editingAccount ? "PUT" : "POST";
    const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        balance: parseFloat(form.balance || "0"),
      }),
    });

    setDialogOpen(false);
    resetForm();
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account? This action cannot be undone.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    fetchAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      type: account.type,
      institution: account.institution || "",
      balance: account.balance,
      color: account.color,
      notes: account.notes || "",
    });
    setDialogOpen(true);
  };

  const assets = accounts
    .filter((a) => a.isActive && !isLiability(a.type))
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const liabilities = accounts
    .filter((a) => a.isActive && isLiability(a.type))
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance)), 0);

  const netWorth = assets - liabilities;

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Accounts</h1></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (<Card key={i}><CardContent className="py-8"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts and track net worth</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}>➕ Add Account</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
              <DialogDescription>
                {editingAccount ? "Update your account details" : "Add a new financial account to track"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Account Name</Label>
                <Input placeholder="e.g., Republic Bank Checking" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Balance</Label>
                  <Input type="number" placeholder="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Institution</Label>
                <Input placeholder="e.g., Republic Bank, GBTI" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.name}>
                {editingAccount ? "Save Changes" : "Add Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Net Worth Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(assets)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{accounts.filter((a) => !isLiability(a.type) && a.isActive).length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Liabilities</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(liabilities)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{accounts.filter((a) => isLiability(a.type) && a.isActive).length} accounts</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${netWorth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(netWorth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Assets − Liabilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 mb-4 text-4xl">🏦</div>
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Add your bank accounts, credit cards, and cash to start tracking your net worth.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Group by type */}
          {["Assets", "Liabilities"].map((group) => {
            const groupAccounts = accounts.filter((a) =>
              group === "Assets" ? !isLiability(a.type) : isLiability(a.type)
            );
            if (groupAccounts.length === 0) return null;

            return (
              <div key={group}>
                <h2 className="text-lg font-semibold mb-3">{group}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupAccounts.map((account) => (
                    <Card key={account.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleEdit(account)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: account.color + "20" }}>
                              {getTypeEmoji(account.type)}
                            </div>
                            <div>
                              <CardTitle className="text-base group-hover:text-primary transition-colors">{account.name}</CardTitle>
                              <CardDescription className="text-xs">{account.institution || getTypeLabel(account.type)}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{getTypeLabel(account.type)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-xl font-bold tabular-nums ${isLiability(account.type) ? "text-red-600 dark:text-red-400" : ""}`}>
                          {formatCurrency(Math.abs(parseFloat(account.balance)))}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">Click to edit</span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
