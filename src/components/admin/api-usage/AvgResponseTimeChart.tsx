import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export interface AggregatedExternalServiceUsage {
  service_name: string;
  total_calls: number;
  avg_response_time_ms: number | null;
  total_tokens_prompt?: number;
  total_tokens_completion?: number;
  total_tokens_total?: number;
  total_cost?: number;
}

interface AvgResponseTimeChartProps {
  data: AggregatedExternalServiceUsage[];
  title?: string;
}

const AvgResponseTimeChart: React.FC<AvgResponseTimeChartProps> = ({ data, title }) => {
  const { t } = useTranslation();

  const chartData = data
    .filter(item => item.avg_response_time_ms !== null && item.avg_response_time_ms > 0)
    .sort((a, b) => (b.avg_response_time_ms ?? 0) - (a.avg_response_time_ms ?? 0)); // Sort descending

  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noAvgResponseTimeData')}</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {title || t('charts.avgResponseTimeByServiceTitle')}
      </h3>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="ms" label={{ value: t('charts.avgResponseTimeLabel'), position: 'insideBottomRight', dy:10, fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="service_name" 
            width={120} 
            tick={{ fontSize: 12 }}
            interval={0} 
            />
          <Tooltip formatter={(value: number) => [`${value} ms`, t('charts.avgResponseTimeTooltip')]} />
          <Legend formatter={() => t('charts.avgResponseTimeLegend')} />
          <Bar dataKey="avg_response_time_ms" fill="#82ca9d" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AvgResponseTimeChart; 