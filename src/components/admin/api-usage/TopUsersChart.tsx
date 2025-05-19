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

// Assuming ApiLogEntry is imported or defined if this chart is used elsewhere with AdminApiUsagePage's data structure
// For now, defining a simplified version based on expected aggregated data structure for this chart
interface UserApiLog {
  name?: string; // User's name
  email?: string; // User's email
  user_id: string; // User ID is the most reliable key for aggregation
  call_count: number; // Call count for a specific function by this user
}

interface ChartDataPoint {
  userName: string; // User name or email for display
  totalCalls: number;
}

interface TopUsersChartProps {
  logs: UserApiLog[]; // Expects logs that can be aggregated by user
  title?: string;
}

const TopUsersChart: React.FC<TopUsersChartProps> = ({ logs, title }) => {
  const { t } = useTranslation();

  const aggregatedUserData = logs.reduce<Record<string, { totalCalls: number; name: string; email: string }>>((acc, log) => {
    const userId = log.user_id;
    const callCount = Number(log.call_count) || 0;
    const userName = log.name || 'Unknown User';
    const userEmail = log.email || userId;

    if (!acc[userId]) {
      acc[userId] = { totalCalls: 0, name: userName, email: userEmail };
    }
    acc[userId].totalCalls += callCount;
    // Update name/email if a more complete entry is found later (though unlikely with pre-aggregated logs)
    if (log.name && acc[userId].name === 'Unknown User') acc[userId].name = log.name;
    if (log.email && acc[userId].email === userId) acc[userId].email = log.email;

    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.values(aggregatedUserData)
    .map(userData => ({ 
      userName: userData.name !== 'Unknown User' ? userData.name : userData.email, // Prefer name, fallback to email/ID
      totalCalls: userData.totalCalls 
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 10); // Show top 10 users, for example

  if (!chartData || chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">{t('charts.noTopUsersData')}</div>;
  }

  return (
    <div style={{ width: '100%', height: 400 }} className="p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {title || t('charts.topApiUsers')}
      </h3>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 100, // Adjust for user names
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="userName" type="category" width={150} interval={0} />
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
            formatter={(value: number) => [value, t('charts.totalCalls')]} 
          />
          <Legend formatter={() => t('charts.totalCallsLegend')} />
          <Bar dataKey="totalCalls" fill="hsl(var(--primary-foreground))" name={t('charts.totalCallsLegend')} /> 
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopUsersChart; 