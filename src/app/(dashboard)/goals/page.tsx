"use client";

import { useState, useEffect } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/constants";

interface Account {
  id: string;
  name: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  icon: string;
  color: string;
  accountId: string | null;
  isCompleted: boolean;
  notes: string | null;
  account: Account | null;
}

const GOAL_ICONS = [
  { value: "🏠", label: "Home" },
  { value: "🚗", label: "Car" },
  { value: "✈️", label: "Travel" },
  { value: "📚", label: "Education" },
  { value: "💍", label: "Wedding" },
  { value: "🏥", label: "Emergency" },
  { value: "📱", label: "Tech" },
  { value: "🎯", label: "General" },
  { value: "👶", label: "Family" },
  { value: "💼", label: "Business" },
];

const COLORS = [
  "#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#6366f1",
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const [form, setForm] = useState({
    name: "", targetAmount: "", currentAmount: "0", deadline: "",
    icon: "🎯", color: "#8b5cf6", accountId: "", notes: "",
  });

  const fetchData = () => {
    Promise.all([
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([g, a]) => { setGoals(g); setAccounts(a); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "", icon: "🎯", color: "#8b5cf6", accountId: "", notes: "" });
    setEditingGoal(null);
  };

  const handleSubmit = async () => {
    const method = editingGoal ? "PUT" : "POST";
    const url = editingGoal ? `/api/goals/${editingGoal.id}` : "/api/goals";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount || "0"),
        accountId: form.accountId || null,
        deadline: form.deadline || null,
      }),
    });

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount,
      deadline: goal.deadline || "", icon: goal.icon, color: goal.color,
      accountId: goal.accountId || "", notes: goal.notes || "",
    });
    setDialogOpen(true);
  };

  const handleAddFunds = async () => {
    if (!selectedGoal || !addAmount) return;
    const newAmount = parseFloat(selectedGoal.currentAmount) + parseFloat(addAmount);
    const isCompleted = newAmount >= parseFloat(selectedGoal.targetAmount);

    await fetch(`/api/goals/${selectedGoal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: newAmount, isCompleted }),
    });

    setAddFundsDialogOpen(false);
    setAddAmount("");
    setSelectedGoal(null);
    fetchData();
  };

  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0);
  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.currentAmount), 0);
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1></div>
        <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="py-12"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Set targets and track your progress toward financial goals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}>🎯 New Goal</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
              <DialogDescription>Set a target and start saving toward it</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Goal Name</Label>
                <Input placeholder="e.g., Emergency Fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Target Amount</Label>
                  <Input type="number" placeholder="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Current Amount</Label>
                  <Input type="number" placeholder="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Deadline (optional)</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Linked Account</Label>
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
                  {GOAL_ICONS.map((ic) => (
                    <button key={ic.value} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${form.icon === ic.value ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`} onClick={() => setForm({ ...form, icon: ic.value })} title={ic.label}>
                      {ic.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.name || !form.targetAmount}>
                {editingGoal ? "Save Changes" : "Create Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Target</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatCurrency(totalTarget)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Saved</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">{formatCurrency(totalSaved)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%</CardTitle>
          </CardHeader>
          <CardContent><Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="h-2" /></CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">Create your first savings goal to start tracking your progress.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active Goals</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => {
                  const target = parseFloat(goal.targetAmount);
                  const current = parseFloat(goal.currentAmount);
                  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;

                  return (
                    <Card key={goal.id} className="group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: goal.color + "20" }}>
                              {goal.icon}
                            </div>
                            <div>
                              <CardTitle className="text-base">{goal.name}</CardTitle>
                              {goal.account && <CardDescription className="text-xs">{goal.account.name}</CardDescription>}
                            </div>
                          </div>
                          {daysLeft !== null && (
                            <Badge variant={daysLeft < 30 ? "destructive" : "secondary"} className="text-xs">
                              {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="tabular-nums font-medium">{formatCurrency(current)}</span>
                          <span className="text-muted-foreground tabular-nums">of {formatCurrency(target)}</span>
                        </div>
                        <Progress value={pct} className="h-3" />
                        <p className="text-xs text-center text-muted-foreground tabular-nums">{pct.toFixed(0)}% complete</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => { setSelectedGoal(goal); setAddFundsDialogOpen(true); }}>
                            💰 Add Funds
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>✏️</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(goal.id)}>🗑️</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">🎉 Completed Goals</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goal.icon}</span>
                        <CardTitle className="text-base line-through">{goal.name}</CardTitle>
                        <Badge className="bg-green-500 text-white text-xs">✓ Complete</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{formatCurrency(parseFloat(goal.targetAmount))}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Funds Dialog */}
      <Dialog open={addFundsDialogOpen} onOpenChange={(o) => { setAddFundsDialogOpen(o); if (!o) { setSelectedGoal(null); setAddAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              Current: {formatCurrency(parseFloat(selectedGoal?.currentAmount || "0"))} / Target: {formatCurrency(parseFloat(selectedGoal?.targetAmount || "0"))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input type="number" placeholder="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button onClick={handleAddFunds} disabled={!addAmount}>Add Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
