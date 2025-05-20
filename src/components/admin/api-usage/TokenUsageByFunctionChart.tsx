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
// Importeer de gedeelde interface als die bestaat, of definieer lokaal indien nodig.
// Voor nu, ervan uitgaande dat AggregatedExternalServiceUsage beschikbaar is via AdminExternalApiUsagePage.tsx
// Dit kan een directe import zijn als AggregatedExternalServiceUsage daar geëxporteerd wordt,
// of we kopiëren de definitie hier.
// import { AggregatedExternalServiceUsage } from '@/pages/admin/AdminExternalApiUsagePage.tsx';

/**
 * @interface AggregatedExternalServiceUsage
 * @description Defines the structure for aggregated external service usage data,
 * typically received from an API endpoint like 'get-api-usage-stats'.
 */
interface AggregatedExternalServiceUsage {
  /** The name of the external service. */
  service_name: string;
  /** The total number of calls made to this service. */
  total_calls: number;
  /** The average response time in milliseconds for this service, if available. */
  avg_response_time_ms: number | null;
  /** The total number of prompt tokens used by this service, if applicable. */
  total_tokens_prompt?: number;
  /** The total number of completion tokens used by this service, if applicable. */
  total_tokens_completion?: number;
  /** The overall total number of tokens (prompt + completion) used by this service, if applicable. */
  total_tokens_total?: number;
  /** The total cost associated with the usage of this service, if applicable. */
  total_cost?: number;
}

/**
 * @interface ChartDataPoint
 * @description Defines the structure for a data point used in the token usage chart.
 */
interface ChartDataPoint {
  /** The name of the service (or service:function combination) for the chart's X-axis label. */
  name: string; // Service name or Service:Function name
  /** The total tokens used. */
  totalTokens: number;
  /** The number of prompt tokens used. */
  promptTokens: number;
  /** The number of completion tokens used. */
  completionTokens: number;
}

/**
 * @interface TokenUsageByFunctionChartProps
 * @description Defines the props for the TokenUsageByFunctionChart component.
 */
interface TokenUsageByFunctionChartProps {
  /** 
   * Array of aggregated external service usage data. 
   * This data is expected to be pre-aggregated per service. 
   */
  logs: AggregatedExternalServiceUsage[]; // CHANGED: Using the correct input type
  /** An optional title for the chart. */
  title?: string;
}

/**
 * TokenUsageByFunctionChart component.
 * @description Renders a bar chart displaying token usage (total, prompt, completion) by function or service.
 * @param {TokenUsageByFunctionChartProps} props - The props for the component.
 * @returns {React.FC<TokenUsageByFunctionChartProps>} The TokenUsageByFunctionChart component.
 */
const TokenUsageByFunctionChart: React.FC<TokenUsageByFunctionChartProps> = ({ logs, title }) => {
  const { t } = useTranslation();

  // The .reduce() step is not necessary here because the 'logs' prop 
  // is expected to already contain data aggregated per service.
  const chartData: ChartDataPoint[] = logs
    .map(log => ({ 
      name: log.service_name || 'Unknown Service',
      totalTokens: log.total_tokens_total || 0,
      promptTokens: log.total_tokens_prompt || 0,
      completionTokens: log.total_tokens_completion || 0,
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
      <ResponsiveContainer width="100%">
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 80,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" type="category" interval={0} angle={0} textAnchor="middle" height={60} tick={{ fontSize: 12 }} />
          <YAxis type="number" allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Legend 
            verticalAlign="top" 
            align="center" 
            wrapperStyle={{ paddingBottom: '20px' }} 
            formatter={(value) => t(`charts.tokenTypes.${value}` as `charts.tokenTypes.${string}`) || value}
          />
          <Bar dataKey="totalTokens" fill="hsl(var(--primary))" name="total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenUsageByFunctionChart; 