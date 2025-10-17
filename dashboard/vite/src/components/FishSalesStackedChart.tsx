import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
ChartContainer
import {
  fetchFishSalesStacked,
  type FishSalesStackedResponse,
} from '../internals/data/fetchFishSalesStacked';

interface FishSalesStackedChartProps {
  days?: number;
  title?: string;
}

export default function FishSalesStackedChart({
  days = 30,
  title = 'Fish Sales Breakdown',
}: FishSalesStackedChartProps) {
  const [data, setData] = React.useState<FishSalesStackedResponse>({
    dataset: [],
    xAxis: [],
    series: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetchFishSalesStacked(days)
      .then(setData)
      .catch((err) => console.error('Fish stacked chart fetch error:', err))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p>Loading fish sales...</p>;

  // {
  //   "fillet": 270000,
  //   "fish": "mahimahi",
  //   "quantity": 173,
  //   "whole": 5580000
  // },
  
  const series = [
    { type: 'bar', dataKey: 'fillet', color: '#577399', stack: 'fish', label: 'fish fillet $' },
    { type: 'bar', dataKey: 'whole', color: '#fe5f55', stack: 'fish', label: 'whole fish $' },
    { type: 'line', dataKey: 'quantity', color: '#bfdbf7', yAxisId: 'rightAxis', label: 'qty sold'
     },
  ] as const;
  
  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Last {days} days EXLUDING the 06/15 fishing exploit (so to normalize the data)
        </Typography>

        <ChartContainer
          dataset={data.dataset}
          series={series}          
          xAxis={[
            {
              scaleType: 'band',
              dataKey: 'fish',
              label: 'fish',              
              tickLabelStyle: {
                angle: 90,
                fontSize: 14,
              },
              height: 200
            },
          ]}
          yAxis={[
            { id: 'leftAxis', width: 100 },
            { id: 'rightAxis', position: 'right', width: 100 },
          ]}
          height={700}          
        >
          <ChartsGrid horizontal />
          <BarPlot />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis />
          <ChartsYAxis axisId="leftAxis" label="Sold TU$" />
          <ChartsYAxis axisId="rightAxis" label="Quantity" />
          <ChartsTooltip />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

