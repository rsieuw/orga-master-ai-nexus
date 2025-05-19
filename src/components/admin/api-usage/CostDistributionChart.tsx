import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { ExternalApiLogDisplayEntry } from '@/pages/admin/AdminExternalApiUsagePage.tsx'; // Adjust path if necessary

interface ChartDataPoint {
  name: string; // Service name
  value: number; // Total cost
}

interface CostDistributionChartProps {
  logs: ExternalApiLogDisplayEntry[];
  title?: string;
}

// Define a list of distinct colors for the pie chart segments
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A230ED', '#FF4560', '#775DD0'];

const CostDistributionChart: React.FC<CostDistributionChartProps> = ({ logs, title }) => {
  const { t } = useTranslation();

  const aggregatedData = logs.reduce<Record<string, number>>((acc, log) => {
    const service = log.service_name || 'Unknown Service';
    const cost = parseFloat(log.cost || '0'); // Ensure cost is a number

    if (!acc[service]) {
      acc[service] = 0;
    }
    acc[service] += cost;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.entries(aggregatedData)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })) // Round to 2 decimal places for currency
    .sort((a, b) => b.value - a.value); // Sort by cost descending

  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noCostDataForChart')}</div>;
  }

  const formatTooltipValue = (value: number, name: string) => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return [`$${value.toFixed(2)} (${percentage}%)`, name];
  };
  
  // Define a type for the customLabel props for better clarity
  interface CustomLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number; // index is often provided, though not used here, good to have for completeness
    name: string; // name is one of the keys from chartData
    // Add other properties if Recharts passes more that might be used, e.g. 'value', 'payload'
  }

  const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percent is large enough to avoid clutter
    if (percent * 100 < 5) { // Threshold: 5%
        return null;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12px"
      >
        {name} ({`${(percent * 100).toFixed(0)}%`})
      </text>
    );
  };


  return (
    <div style={{ width: '100%', height: 400 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {title || t('charts.costDistributionByService')}
      </h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={customLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostDistributionChart; 