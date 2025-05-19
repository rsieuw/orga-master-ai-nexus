import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface ApiLog {
  // Internal logs structure
  function_name?: string | null; 
  // External logs structure
  service_name?: string | null;
  // Common or other fields if needed for more detailed grouping/tooltips
}

interface ChartDataPoint {
  name: string; // Function name or Service:Function name
  count: number;
}

interface PopularFunctionsChartProps {
  logs: ApiLog[];
  logType: 'internal' | 'external';
  title?: string; // Optional title for the chart
}

const PopularFunctionsChart: React.FC<PopularFunctionsChartProps> = ({ logs, logType, title }) => {
  const { t } = useTranslation();

  const aggregatedData = logs.reduce<Record<string, number>>((acc, log) => {
    let key: string | null = null;
    if (logType === 'internal' && log.function_name) {
      key = log.function_name;
    } else if (logType === 'external') {
      if (log.service_name && log.function_name) {
        key = `${log.service_name}: ${log.function_name}`;
      } else if (log.service_name) {
        key = log.service_name; // Fallback if function_name is missing for an external log
      }
    }

    if (key) {
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
    }
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.entries(aggregatedData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 15); // Show top 15, for example

  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noPopularFunctionsData')}</div>;
  }

  return (
    <div style={{ width: '100%', height: 400 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {title || (logType === 'internal' ? t('charts.popularInternalFunctions') : t('charts.popularExternalFunctions'))}
      </h3>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical" // Vertical bar chart for better readability of function names
          margin={{
            top: 5,
            right: 30,
            left: 150, // Increased left margin for YAxis labels
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={200} interval={0} /> {/* Increased width, ensure all labels are shown */}
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              color: 'hsl(var(--popover-foreground))', 
              borderRadius: 'var(--radius)', // Using theme variable for border radius
              padding: '0.5rem 0.75rem',
              boxShadow: 'var(--shadow-md)' // Using theme variable for shadow
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))', marginBottom: '0.25rem', fontWeight: '600'}}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            formatter={(value: number) => [value, t('charts.callCount')]} 
          />
          <Legend formatter={() => t('charts.callCountLegend')} />
          <Bar dataKey="count" fill="hsl(var(--primary))" name={t('charts.callCountLegend')} /> {/* Using theme primary color */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PopularFunctionsChart; 