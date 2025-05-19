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
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useTranslation } from 'react-i18next';
import { ExternalApiLogDisplayEntry } from '@/pages/admin/AdminExternalApiUsagePage.tsx'; // Assuming this type has token fields

interface ChartDataPoint {
  name: string; // Service name or Service:Function name
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

interface TokenUsageByFunctionChartProps {
  logs: ExternalApiLogDisplayEntry[];
  title?: string;
}

const TokenUsageByFunctionChart: React.FC<TokenUsageByFunctionChartProps> = ({ logs, title }) => {
  const { t } = useTranslation();

  const aggregatedData = logs.reduce<Record<string, { totalTokens: number; promptTokens: number; completionTokens: number }>>((acc, log) => {
    // Use service_name as primary key, can be extended to service_name + function_name if needed for more granularity
    const key = log.service_name || 'Unknown Service';
    const total = log.tokens_total || 0;
    const prompt = log.tokens_prompt || 0;
    const completion = log.tokens_completion || 0;

    if (!acc[key]) {
      acc[key] = { totalTokens: 0, promptTokens: 0, completionTokens: 0 };
    }
    acc[key].totalTokens += total;
    acc[key].promptTokens += prompt;
    acc[key].completionTokens += completion;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.entries(aggregatedData)
    .map(([name, data]) => ({ 
      name,
      totalTokens: data.totalTokens,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens) // Sort by total tokens descending
    .slice(0, 15); // Show top 15, adjust as needed

  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noTokenDataForChart')}</div>; // Re-use existing translation
  }

  // Custom tooltip to show all token types
  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      // Use more generic keys for tooltip, assuming they will be defined
      return (
        <div className="p-2 bg-popover text-popover-foreground shadow-md rounded-md text-sm">
          <p className="label font-semibold">{`${label}`}</p>
          { /* payload[0].name refers to the dataKey of the Bar, which we will set to 'total', 'prompt', etc. */}
          <p className="intro">{`${t('charts.tokenTypes.total')}: ${data.totalTokens}`}</p>
          <p className="desc">{`${t('charts.tokenTypes.prompt')}: ${data.promptTokens}`}</p>
          <p className="desc">{`${t('charts.tokenTypes.completion')}: ${data.completionTokens}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 400 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {title || t('charts.tokenUsageByFunction')}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 100, // Adjust for longer service/function names
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          {/* Pass the raw key to the formatter. The value will be the dataKey of the Bar ('total', 'prompt', etc.) */}
          <Legend formatter={(value) => t(`charts.tokenTypes.${value}` as `charts.tokenTypes.${string}`) || value} />
          {/* Use the un-translated key for the name, so the formatter receives it correctly */}
          <Bar dataKey="totalTokens" fill="hsl(var(--primary))" name="total" />
          {/* We could stack prompt and completion tokens if desired, but totalTokens gives a clearer overview for "most expensive" */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenUsageByFunctionChart; 