import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  MenuItem,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { BarChart, type BarChartProps } from '@mui/x-charts/BarChart';
import { CATEGORY_COLORS } from '../internals/data/colors';
import { fetchStackedCategoryData, type StackedCategoryData } from '../internals/data/fetchStackedSalesData';

type BuySellType = 'buy' | 'sell' | 'all';

interface SalesByCategoryPieProps {
  days?: number;
  title?: string;
}

export default function CategoryDaily({ days = 999, title = 'By category' }: SalesByCategoryPieProps) {
  const [data, setData] = React.useState<StackedCategoryData>({ dataset: [], series: [] });
  const [loading, setLoading] = React.useState(true);
  const [buySell, setBuySell] = React.useState<BuySellType>('all');

  React.useEffect(() => {
    setLoading(true);
    fetchStackedCategoryData(days, buySell)
      .then(setData)
      .catch((err: unknown) => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, [days, buySell]);

  const handleTypeChange = (event: SelectChangeEvent) => {
    setBuySell(event.target.value as BuySellType);
  };

  if (loading) return <p>Loading...</p>;

  const { dataset, series } = data;

  const coloredSeries = series.map((s) => ({
    ...s,
    color: CATEGORY_COLORS[s.dataKey] ?? '#999',
  }));

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Select size="small" value={buySell} onChange={handleTypeChange}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </Select>
        </Stack>
        <BarChart
          dataset={dataset}
          series={coloredSeries}
          xAxis={[
            {
              data: dataset.map((x) => x.date_type),
              valueFormatter: formatType,
              scaleType: 'band',
              position: 'bottom',
            },
            {
              data:
                buySell === 'all'
                  ? dataset.map((x) => x.date_type).filter((_, i) => i % 2 === 0)
                  : dataset.map((x) => x.date_type),
              valueFormatter: formatDate,
              position: 'bottom',
              tickLabelPlacement: 'middle',
              disableLine: false,
              disableTicks: false,
            },
          ]}
          yAxis={[{ width: 80 }]}
          {...chartConfig}
        />
      </CardContent>
    </Card>
  );
}

const formatDate = (dateType: string): string => {
  const [date] = dateType.split('_');
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
};

const formatType = (dateType: string): string => {
  const [, type] = dateType.split('_');
  return type;
};

const chartConfig: Partial<BarChartProps> = {
  height: 450,
  margin: { left: 40 },
  hideLegend: false,
  grid: { horizontal: true, vertical: true },
};