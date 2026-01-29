"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalaryCalculator } from "./salary-calculator";
import { NISTracker } from "./nis-tracker";
import { PropertyTaxEstimator } from "./property-tax-estimator";
import { TaxCalendar } from "./tax-calendar";
import { SalaryProjector } from "./salary-projector";

export function TaxModule() {
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          🇬🇾 Guyana Tax Centre
        </h1>
        <p className="text-muted-foreground">
          Calculate PAYE, NIS contributions, property tax, and plan your finances
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="calculator" className="text-xs sm:text-sm">
            💰 Salary
          </TabsTrigger>
          <TabsTrigger value="nis" className="text-xs sm:text-sm">
            🏛️ NIS
          </TabsTrigger>
          <TabsTrigger value="property" className="text-xs sm:text-sm">
            🏠 Property
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">
            📅 Calendar
          </TabsTrigger>
          <TabsTrigger value="projector" className="text-xs sm:text-sm">
            📈 Projector
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <SalaryCalculator />
        </TabsContent>

        <TabsContent value="nis" className="space-y-4">
          <NISTracker />
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          <PropertyTaxEstimator />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <TaxCalendar />
        </TabsContent>

        <TabsContent value="projector" className="space-y-4">
          <SalaryProjector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
