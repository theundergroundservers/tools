import { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, CardContent, Typography, Stack } from '@mui/material';
import type { LineChartProps } from '@mui/x-charts';

export default function CumulativeSalesLineChart({ days = 30 }) {
  const [data, setData] = useState({ dataset: [], series: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/cumulative_sales_by_day?days=${days}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error fetching cumulative data:', err))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p>Loading cumulative data...</p>;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          📈 Cumulative Buy vs Sell (Last {days} Days)
        </Typography>
        <Stack sx={{ height: 400 }}>
          <LineChart
            dataset={data.dataset}
            series={data.series}
            xAxis={[{ dataKey: 'date', scaleType: 'band', valueFormatter: formatDate }]}
            yAxis={[{ label: 'Total Sales ($)', width: 80 }]}
            {...chartConfig}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

// Format YYYY-MM-DD to MM/DD
const formatDate = (date: string) => {
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
};

const chartConfig: Partial<LineChartProps> = {
  height: 400,
  margin: { left: 60, right: 30, top: 30, bottom: 40 },
  grid: { horizontal: true },
  tooltip: { trigger: 'axis' },
  legend: { direction: 'row', position: { vertical: 'top', horizontal: 'middle' } },
};