import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JobApplication } from "@/features/applications/types";

interface ActivityChartProps {
  applications: JobApplication[];
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function ActivityChart({ applications }: ActivityChartProps) {
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const key = dateKey(date);
      const count = applications.filter(
        (application) =>
          application.appliedAt && dateKey(new Date(application.appliedAt)) === key,
      ).length;

      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        applications: count,
      };
    });
  }, [applications]);

  return (
    <div className="activity-chart" role="img" aria-label="Applications submitted each day over the past 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6558e8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6558e8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ececf3" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#85869a", fontSize: 11 }}
            interval={4}
            tickMargin={12}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#85869a", fontSize: 11 }}
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #ececf3",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(27, 28, 48, 0.1)",
            }}
            labelStyle={{ color: "#222338", fontWeight: 600 }}
            formatter={(value) => [`${value} submitted`, "Applications"]}
          />
          <Area
            type="monotone"
            dataKey="applications"
            stroke="#6558e8"
            strokeWidth={2.5}
            fill="url(#activityFill)"
            activeDot={{ r: 5, strokeWidth: 0, fill: "#6558e8" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
