"use client";

import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TAX_DEADLINES, NIS_PAYMENT_DUE_DAY } from "@/lib/tax-constants";

interface CalendarEvent {
  name: string;
  description: string;
  date: Date;
  type: "gra_filing" | "property_tax" | "nis_payment";
  daysUntil: number;
  urgency: "overdue" | "urgent" | "soon" | "upcoming" | "future";
}

function getUrgency(daysUntil: number): CalendarEvent["urgency"] {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "urgent";
  if (daysUntil <= 30) return "soon";
  if (daysUntil <= 90) return "upcoming";
  return "future";
}

function getUrgencyColor(urgency: CalendarEvent["urgency"]) {
  switch (urgency) {
    case "overdue":
      return "bg-red-500 text-white";
    case "urgent":
      return "bg-orange-500 text-white";
    case "soon":
      return "bg-yellow-500 text-black";
    case "upcoming":
      return "bg-blue-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "gra_filing":
      return "📄";
    case "property_tax":
      return "🏠";
    case "nis_payment":
      return "💰";
    default:
      return "📅";
  }
}

export function TaxCalendar() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();

  // Build full event list for the year
  const events: CalendarEvent[] = [];

  // Tax deadlines
  for (const deadline of TAX_DEADLINES) {
    let deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
    // If already passed this year, show next year
    if (deadlineDate < now) {
      deadlineDate = new Date(currentYear + 1, deadline.month - 1, deadline.day);
    }
    const daysUntil = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    events.push({
      name: deadline.name,
      description: deadline.description,
      date: deadlineDate,
      type: deadline.type,
      daysUntil,
      urgency: getUrgency(daysUntil),
    });
  }

  // NIS monthly deadlines (14th of each month)
  for (let m = 0; m < 12; m++) {
    const nisDate = new Date(currentYear, m, NIS_PAYMENT_DUE_DAY);
    if (nisDate < now) {
      // Past dates — skip or show as overdue if recent
      const daysPast = Math.ceil(
        (now.getTime() - nisDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysPast <= 7) {
        events.push({
          name: `NIS Payment — ${nisDate.toLocaleString("default", { month: "long" })}`,
          description: `NIS contribution due for ${new Date(currentYear, m - 1, 1).toLocaleString("default", { month: "long" })}`,
          date: nisDate,
          type: "nis_payment",
          daysUntil: -daysPast,
          urgency: "overdue",
        });
      }
      continue;
    }
    const daysUntil = Math.ceil(
      (nisDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    events.push({
      name: `NIS Payment — ${nisDate.toLocaleString("default", { month: "long" })}`,
      description: `NIS contribution due for ${new Date(currentYear, m - 1, 1).toLocaleString("default", { month: "long" })}`,
      date: nisDate,
      type: "nis_payment",
      daysUntil,
      urgency: getUrgency(daysUntil),
    });
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Next upcoming events (top 3 urgency)
  const upcomingEvents = events
    .filter((e) => e.daysUntil >= 0)
    .slice(0, 6);

  const overdueEvents = events.filter((e) => e.daysUntil < 0);

  const generateReminders = async () => {
    setGenerating(true);
    try {
      await fetch("/api/taxes/reminders", { method: "POST" });
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tax Calendar {currentYear}</h2>
          <p className="text-sm text-muted-foreground">
            GRA, NIS, and property tax deadlines
          </p>
        </div>
        <Button
          onClick={generateReminders}
          disabled={generating}
          variant="outline"
        >
          {generated ? "✅ Reminders Sent!" : generating ? "Generating..." : "🔔 Generate Reminders"}
        </Button>
      </div>

      {/* Overdue Alerts */}
      {overdueEvents.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-600 dark:text-red-400">
              ⚠️ Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueEvents.map((event, i) => (
                <EventRow key={i} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📅 Upcoming Deadlines</CardTitle>
          <CardDescription>Next tax-related due dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <EventRow key={i} event={event} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Full Year Timeline</CardTitle>
          <CardDescription>All tax events for {currentYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events
              .filter((e) => e.daysUntil >= 0)
              .map((event, i) => (
                <EventRow key={i} event={event} compact />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EventRow({ event, compact }: { event: CalendarEvent; compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        compact ? "border-b last:border-0" : "p-3 border rounded-lg"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{getTypeIcon(event.type)}</span>
        <div>
          <p className={`font-medium ${compact ? "text-sm" : ""}`}>
            {event.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {event.date.toLocaleDateString("en-US", {
              weekday: compact ? undefined : "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <Badge className={getUrgencyColor(event.urgency)}>
        {event.daysUntil < 0
          ? `${Math.abs(event.daysUntil)}d overdue`
          : event.daysUntil === 0
            ? "Today!"
            : `${event.daysUntil}d`}
      </Badge>
    </div>
  );
}
