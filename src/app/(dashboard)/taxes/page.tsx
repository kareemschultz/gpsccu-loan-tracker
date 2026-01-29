import type { Metadata } from "next";
import { TaxModule } from "@/components/taxes/tax-module";

export const metadata: Metadata = {
  title: "Tax Calculator | FundSight",
  description: "Guyana tax calculator — PAYE, NIS, property tax, and more.",
};

export default function TaxesPage() {
  return <TaxModule />;
}
