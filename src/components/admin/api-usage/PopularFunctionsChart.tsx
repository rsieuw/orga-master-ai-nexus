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

/**
 * @interface ApiLog
 * @description Defines the structure for an API log entry, adaptable for internal or external logs.
 */
interface ApiLog {
  /** The name of the function called (for internal logs). */
  function_name?: string | null; 
  /** The name of the external service called (for external logs). */
  service_name?: string | null;
  /** The aggregated call count, typically provided by the parent component if data is pre-aggregated. */
  call_count?: number; // ADDED: To receive the already aggregated count from the parent
  // Common or other fields if needed for more detailed grouping/tooltips
}

/**
 * @interface ChartDataPoint
 * @description Defines the structure for a data point used in the chart.
 */
interface ChartDataPoint {
  /** The name of the function or service, used as the label on the chart axis. */
  name: string; // Function name or Service:Function name
  /** The count of calls for this function or service. */
  count: number;
}

/**
 * @interface PopularFunctionsChartProps
 * @description Defines the props for the PopularFunctionsChart component.
 */
interface PopularFunctionsChartProps {
  /** The array of API log data to display. */
  logs: ApiLog[];
  /** The type of logs being displayed ('internal' or 'external'). */
  logType: 'internal' | 'external';
  /** An optional title for the chart. */
  title?: string; // Optional title for the chart
}

/**
 * PopularFunctionsChart component.
 * @description Renders a bar chart displaying the most popular functions or services based on call count.
 * @param {PopularFunctionsChartProps} props - The props for the component.
 * @returns {React.FC<PopularFunctionsChartProps>} The PopularFunctionsChart component.
 */
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
      acc[key] += log.call_count || 0;
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
          layout="horizontal"
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 120,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" type="category" interval={0} angle={-45} textAnchor="end" height={100} />
          <YAxis type="number" allowDecimals={false} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              color: 'hsl(var(--popover-foreground))', 
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.75rem',
              boxShadow: 'var(--shadow-md)'
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))', marginBottom: '0.25rem', fontWeight: '600'}}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            formatter={(value: number) => [value, t('charts.callCount')]} 
          />
          <Legend 
            verticalAlign="top" 
            align="center" 
            wrapperStyle={{ paddingBottom: '20px' }}
            formatter={() => t('charts.callCountLegend')} 
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" name={t('charts.callCountLegend')} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PopularFunctionsChart; 