import { 
  LineChart, 
  Line,
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';

// Historical Trend Chart Component
interface HistoricalTrendProps {
  title: string;
  data: Array<{
    date: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey: string;
  yAxisLabel?: string;
  stroke?: string;
  timeRanges?: Array<{
    label: string;
    value: string;
    days: number;
  }>;
  showComparison?: boolean;
  comparisonKey?: string;
  comparisonLabel?: string;
  comparisonStroke?: string;
}

export const HistoricalTrendChart = ({
  title,
  data,
  dataKey,
  yAxisLabel = '',
  stroke = '#8884d8',
  timeRanges,
  showComparison = false,
  comparisonKey = '',
  comparisonLabel = '',
  comparisonStroke = '#82ca9d'
}: HistoricalTrendProps) => {
  const [timeRange, setTimeRange] = useState(timeRanges ? timeRanges[0].value : '30d');
  
  // Filter data based on selected time range
  const filteredData = timeRanges 
    ? data.slice(-(timeRanges.find(r => r.value === timeRange)?.days ?? 30))
    : data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {timeRanges && (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value} className="text-xs">
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => {
                // Format date to shorter version
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: 12 }
              }} 
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value) => [value, dataKey]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={stroke} 
              activeDot={{ r: 8 }} 
              name={dataKey}
            />
            {showComparison && comparisonKey && (
              <Line 
                type="monotone" 
                dataKey={comparisonKey} 
                stroke={comparisonStroke} 
                name={comparisonLabel || comparisonKey}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Bar Chart Component
interface BarChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  barColor?: string;
  barSize?: number;
}

export const EnvironmentBarChart = ({
  title,
  data,
  dataKey,
  xAxisLabel = '',
  yAxisLabel = '',
  barColor = '#8884d8',
  barSize = 30
}: BarChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              label={{ 
                value: xAxisLabel, 
                position: 'insideBottom',
                offset: -5,
                style: { textAnchor: 'middle', fontSize: 12 }
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: 12 }
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              fill={barColor} 
              barSize={barSize}
              name={dataKey}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Pie Chart Component
interface PieChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export const EnvironmentPieChart = ({
  title,
  data,
  dataKey,
  nameKey = 'name',
  innerRadius = 60,
  outerRadius = 90
}: PieChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value}`, name]} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Area Chart Component
interface AreaChartProps {
  title: string;
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  areas: Array<{
    dataKey: string;
    fill: string;
    stroke: string;
    stackId?: string;
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export const EnvironmentAreaChart = ({
  title,
  data,
  areas,
  xAxisLabel = '',
  yAxisLabel = ''
}: AreaChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              label={{ 
                value: xAxisLabel, 
                position: 'insideBottom',
                offset: -5,
                style: { textAnchor: 'middle', fontSize: 12 }
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: 12 }
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            {areas.map((area, index) => (
              <Area
                key={`area-${index}`}
                type="monotone"
                dataKey={area.dataKey}
                fill={area.fill}
                stroke={area.stroke}
                stackId={area.stackId}
                name={area.dataKey}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Indicator Card Component
interface IndicatorCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  unit?: string;
  change?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendDescription?: string;
}

export const EnvironmentIndicatorCard = ({
  title,
  value,
  description,
  icon,
  color = 'text-primary',
  unit = '',
  change,
  trendDirection,
  trendDescription
}: IndicatorCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {value}{unit}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {description}
          </div>
        )}
        {trendDirection && change !== undefined && (
          <div className="flex items-center mt-2 text-xs">
            {trendDirection === 'up' && (
              <span className="text-green-500 flex items-center">
                ↑ {change}%
              </span>
            )}
            {trendDirection === 'down' && (
              <span className="text-red-500 flex items-center">
                ↓ {change}%
              </span>
            )}
            {trendDirection === 'neutral' && (
              <span className="text-gray-500 flex items-center">
                → {change}%
              </span>
            )}
            {trendDescription && (
              <span className="ml-1 text-muted-foreground">
                {trendDescription}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
