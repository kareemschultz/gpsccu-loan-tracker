"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { addPayment } from "@/app/actions";


interface TrackerClientProps {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    initialLoans: any[];
    initialPayments: any[];
}

export function TrackerClient({ initialLoans, initialPayments }: TrackerClientProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [loanId, setLoanId] = useState<string>(initialLoans[0]?.id || "");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [amount, setAmount] = useState("");
    const [paymentType, setPaymentType] = useState<"regular" | "extra">("regular");
    const [source, setSource] = useState<string>("salary");
    const [notes, setNotes] = useState("");

    const handleLoanChange = (value: string | null) => {
        if (value) setLoanId(value);
    };
    const handlePaymentTypeChange = (value: string | null) => {
        if (value === "regular" || value === "extra") setPaymentType(value);
    };
    const handleSourceChange = (value: string | null) => {
        if (value) setSource(value);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-GY", {
            style: "currency",
            currency: "GYD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const result = await addPayment({
                loanId,
                paymentDate,
                amount: parseFloat(amount),
                paymentType,
                source: source as any,
                notes: notes || undefined,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Payment recorded successfully!");
            setDialogOpen(false);

            // Reset form
            setAmount("");
            setPaymentType("regular");
            setSource("salary");
            setNotes("");

        } catch {
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex justify-end -mt-10 mb-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger className={buttonVariants()} disabled={initialLoans.length === 0}>
                        Record Payment
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>
                                Enter the details of your payment
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="loan">Loan</Label>
                                <Select value={loanId} onValueChange={handleLoanChange} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select loan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {initialLoans.map((loan) => (
                                            <SelectItem key={loan.id} value={loan.id}>
                                                {loan.vehicleDescription || "Car Loan"} (
                                                {loan.lender?.shortName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Payment Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (GYD)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="111222"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Payment Type</Label>
                                    <Select
                                        value={paymentType}
                                        onValueChange={handlePaymentTypeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="extra">Extra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Select value={source} onValueChange={handleSourceChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="salary">Salary</SelectItem>
                                            <SelectItem value="gratuity">Gratuity</SelectItem>
                                            <SelectItem value="bonus">Bonus</SelectItem>
                                            <SelectItem value="investment">Investment</SelectItem>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Add any notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Recording..." : "Record Payment"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>


            {initialLoans.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-muted-foreground mb-4">
                            Add a loan first before recording payments.
                        </p>
                        <Link href="/loans/new" className={buttonVariants()}>
                            Add Loan
                        </Link>
                    </CardContent>
                </Card>
            ) : initialPayments.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-primary/10 p-6 mb-4">
                            <svg
                                className="h-10 w-10 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Start tracking your loan repayment progress by recording your first payment.
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            Record Your First Payment
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>
                            All your recorded payments across all loans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Loan</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {payment.loan?.vehicleDescription || "Car Loan"}
                                            <span className="text-muted-foreground text-xs ml-1">
                                                ({payment.loan?.lender?.shortName})
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(parseFloat(payment.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    payment.paymentType === "extra" ? "default" : "secondary"
                                                }
                                            >
                                                {payment.paymentType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{payment.source}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                            {payment.notes || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
