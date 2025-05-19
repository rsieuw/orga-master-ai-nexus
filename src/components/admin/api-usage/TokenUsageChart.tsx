import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Interface for the raw log data passed as prop
interface ExternalApiLog {
  called_at: string; // ISO string
  tokens_prompt?: number | null;
  tokens_completion?: number | null;
  tokens_total?: number | null;
  // Add other relevant fields if needed, e.g., function_name or service_name for filtering/grouping
}

// Interface for the data points used by the chart
interface ChartDataPoint {
  date: string; // Formatted date string for display on XAxis
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface TokenUsageChartProps {
  logs: ExternalApiLog[];
  // Add other props like timePeriod ('daily', 'weekly') if needed for dynamic aggregation
}

const TokenUsageChart: React.FC<TokenUsageChartProps> = ({ logs }) => {
  const { t } = useTranslation();

  // Process logs to aggregate data by day
  const aggregatedData = logs.reduce<Record<string, ChartDataPoint>>((acc, log) => {
    if (log.called_at) {
      try {
        const dateKey = format(parseISO(log.called_at), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: format(parseISO(log.called_at), 'MMM dd'), // Format for XAxis label
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          };
        }
        acc[dateKey].promptTokens += log.tokens_prompt || 0;
        acc[dateKey].completionTokens += log.tokens_completion || 0;
        acc[dateKey].totalTokens += log.tokens_total || 0;
      } catch (error) {
        console.error("Error parsing date for chart:", log.called_at, error);
      }
    }
    return acc;
  }, {});

  const chartData = Object.values(aggregatedData).sort((a, b) => {
    // Helper to parse 'MMM dd' into a comparable Date object, assuming current year
    const parseChartDate = (dateStr: string) => {
        const currentYear = new Date().getFullYear();
        // Attempt to parse with current year. date-fns parse is more robust.
        // For simplicity, new Date() should work for 'MMM dd YYYY' format.
        return new Date(`${dateStr} ${currentYear}`);
    };
    return parseChartDate(a.date).getTime() - parseChartDate(b.date).getTime();
  });
  
  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noTokenData')}</div>;
  }

  return (
    <div style={{ width: '100%', height: 400 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{t('charts.tokenUsageOverTime')}</h3>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              const translationKey = `charts.tokenTypes.${name}`;
              const translatedName = t(translationKey);
              return [value, translatedName];
            }}
          />
          <Legend 
            formatter={(value: string) => {
              const translationKey = `charts.tokenTypes.${value}`;
              return t(translationKey);
            }}
          />
          <Line type="monotone" dataKey="promptTokens" stroke="#8884d8" name="promptTokens" />
          <Line type="monotone" dataKey="completionTokens" stroke="#82ca9d" name="completionTokens" />
          <Line type="monotone" dataKey="totalTokens" stroke="#ffc658" name="totalTokens" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenUsageChart; 