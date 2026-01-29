"use client";

import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import { calculatePropertyTax, type PropertyTaxResult } from "@/lib/tax-calculator";
import { PROPERTY_TAX_RATES } from "@/lib/tax-constants";

export function PropertyTaxEstimator() {
  const [arv, setArv] = useState<number>(0);
  const [locationType, setLocationType] = useState<"georgetown" | "municipality" | "rural">("georgetown");
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">("residential");
  const [result, setResult] = useState<PropertyTaxResult | null>(null);

  const updateArv = (val: string) => {
    const v = parseFloat(val) || 0;
    setArv(v);
    if (v > 0) setResult(calculatePropertyTax(v, locationType, propertyType));
    else setResult(null);
  };

  /* empty – inline handlers used instead */

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏠 Property Tax Calculator</CardTitle>
            <CardDescription>
              Estimate your annual property tax based on Annual Rental Value (ARV)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Annual Rental Value (ARV) in GYD</Label>
              <Input
                type="number"
                value={arv || ""}
                onChange={(e) => updateArv(e.target.value)}
                placeholder="e.g., 500000"
              />
              <p className="text-xs text-muted-foreground">
                The ARV is assessed by the Valuation Division. It represents the
                estimated rental income your property could generate annually.
              
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={locationType}
                onValueChange={(v) => {
                  if (!v) return;
                  const loc = v as "georgetown" | "municipality" | "rural";
                  setLocationType(loc);
                  if (arv > 0) setResult(calculatePropertyTax(arv, loc, propertyType));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TAX_RATES).map(([id, cfg]) => (
                    <SelectItem key={id} value={id}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => {
                  if (!v) return;
                  const pt = v as "residential" | "commercial";
                  setPropertyType(pt);
                  if (arv > 0) setResult(calculatePropertyTax(arv, locationType, pt));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Estimate</CardTitle>
            <CardDescription>
              Based on current Guyana property tax rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Annual Tax</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(Math.round(result.annualTax))}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Monthly Equivalent
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(Math.round(result.monthlyEquivalent))}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <DetailRow
                    label="Annual Rental Value"
                    value={formatCurrency(result.annualRentalValue)}
                  />
                  <DetailRow
                    label="Location"
                    value={
                      PROPERTY_TAX_RATES[
                        result.locationType as keyof typeof PROPERTY_TAX_RATES
                      ]?.label || result.locationType
                    }
                  />
                  <DetailRow
                    label="Property Type"
                    value={
                      result.propertyType.charAt(0).toUpperCase() +
                      result.propertyType.slice(1)
                    }
                  />
                  <DetailRow
                    label="Tax Rate"
                    value={`${(result.taxRate * 100).toFixed(2)}%`}
                  />
                  <div className="border-t pt-2">
                    <DetailRow
                      label="Quarterly Payment"
                      value={formatCurrency(Math.round(result.quarterlyTax))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-4">🏡</div>
                <p className="text-muted-foreground">
                  Enter your property&apos;s ARV to see the estimated tax
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rate Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Property Tax Rate Reference</CardTitle>
          <CardDescription>
            Current Guyana property tax rates by location and type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Location</th>
                  <th className="text-right py-2 px-3 font-medium">
                    Residential
                  </th>
                  <th className="text-right py-2 px-3 font-medium">
                    Commercial
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PROPERTY_TAX_RATES).map(([id, rates]) => (
                  <tr key={id} className="border-b last:border-0">
                    <td className="py-2 px-3">{rates.label}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {(rates.residential * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {(rates.commercial * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
