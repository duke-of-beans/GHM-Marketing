"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartData = any[];

import { getChartColorScale, CHART_GRID_COLOR, CHART_AXIS_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "@/lib/chart-tokens";

const COLORS = getChartColorScale(8);

/**
 * Revenue Trend Chart - Show MRR growth over time
 */
export function RevenueTrendChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Growth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="month" tick={{ fill: CHART_AXIS_COLOR }} />
            <YAxis tick={{ fill: CHART_AXIS_COLOR }} />
            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
            <Area 
              type="monotone" 
              dataKey="mrr" 
              stroke={COLORS[0]} 
              fillOpacity={1} 
              fill="url(#colorMRR)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Client Health Distribution - Pie chart of health scores
 */
export function ClientHealthChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Health Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Sales Performance by Rep - Bar chart comparing reps
 */
export function SalesRepPerformanceChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Rep Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis type="number" tick={{ fill: CHART_AXIS_COLOR }} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fill: CHART_AXIS_COLOR }} />
            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
            <Bar dataKey="revenue" fill={COLORS[0]} />
            <Bar dataKey="deals" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Territory Comparison - Radar chart showing territory metrics
 */
export function TerritoryComparisonChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Territory Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar 
              name="Territory A" 
              dataKey="territoryA" 
              stroke={COLORS[0]} 
              fill={COLORS[0]} 
              fillOpacity={0.3} 
            />
            <Radar 
              name="Territory B" 
              dataKey="territoryB" 
              stroke={COLORS[2]} 
              fill={COLORS[2]} 
              fillOpacity={0.3} 
            />
            <Legend />
            <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Task Completion Trend - Line chart showing task metrics over time
 */
export function TaskCompletionTrendChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="week" tick={{ fill: CHART_AXIS_COLOR }} />
            <YAxis tick={{ fill: CHART_AXIS_COLOR }} />
            <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke={COLORS[0]} 
              strokeWidth={2}
              name="Completed"
            />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke={COLORS[1]} 
              strokeWidth={2}
              name="Created"
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke={COLORS[2]} 
              strokeWidth={2}
              name="Pending"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Service Mix Analysis - Stacked bar chart of products sold
 */
export function ServiceMixChart({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Mix & Revenue Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="month" tick={{ fill: CHART_AXIS_COLOR }} />
            <YAxis tick={{ fill: CHART_AXIS_COLOR }} />
            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
            <Legend />
            <Bar dataKey="seo" stackId="a" fill={COLORS[0]} name="SEO" />
            <Bar dataKey="ppc" stackId="a" fill={COLORS[2]} name="PPC" />
            <Bar dataKey="social" stackId="a" fill={COLORS[1]} name="Social" />
            <Bar dataKey="content" stackId="a" fill={COLORS[4]} name="Content" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
