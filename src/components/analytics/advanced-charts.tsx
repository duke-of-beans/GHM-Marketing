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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

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
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value}`} />
            <Area 
              type="monotone" 
              dataKey="mrr" 
              stroke="#10b981" 
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
            <Tooltip />
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value) => `$${value}`} />
            <Bar dataKey="revenue" fill="#3b82f6" />
            <Bar dataKey="deals" fill="#10b981" />
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
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3} 
            />
            <Radar 
              name="Territory B" 
              dataKey="territoryB" 
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.3} 
            />
            <Legend />
            <Tooltip />
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Completed"
            />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Created"
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke="#f59e0b" 
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value}`} />
            <Legend />
            <Bar dataKey="seo" stackId="a" fill="#3b82f6" name="SEO" />
            <Bar dataKey="ppc" stackId="a" fill="#10b981" name="PPC" />
            <Bar dataKey="social" stackId="a" fill="#f59e0b" name="Social" />
            <Bar dataKey="content" stackId="a" fill="#8b5cf6" name="Content" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
