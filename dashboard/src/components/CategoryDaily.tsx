import * as React from 'react';
import {
  Card,
  CardContent,
  Chip,
  Typography,
  Stack,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { BarChart, type BarChartProps } from '@mui/x-charts/BarChart';
import {
  GetCategoryDailyStackedByType,
  CATEGORY_COLORS,
} from '../internals/data/gridData';

type BuySellType = 'buy' | 'sell' | 'all';

interface SalesByCategoryPieProps {
  days?: number;
  title?: string;
}

interface DataRow {
  date_type: string;
  [key: string]: unknown;
}

interface SeriesItem {
  dataKey: string;
  [key: string]: unknown;
}

export default function SalesByCategoryPie({
  days = 999,
  title = 'By category',
}: SalesByCategoryPieProps) {
  const [data, setData] = React.useState<{
    dataset: DataRow[];
    series: SeriesItem[];
  }>({
    dataset: [],
    series: [],
  });

  const [loading, setLoading] = React.useState(true);
  const [buySell, setBuySell] = React.useState<BuySellType>('all');

  React.useEffect(() => {
    setLoading(true);
    GetCategoryDailyStackedByType(days, buySell)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Fetch error:', err))
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

  const uniqueDates = [...new Set(dataset.map((row) => row.date_type.split('_')[0]))];
  const dateTypeMap = dataset.reduce((map, row) => {
    const baseDate = row.date_type.split('_')[0];
    if (!map[baseDate]) {
      map[baseDate] = row.date_type;
    }
    return map;
  }, {} as Record<string, string>);

  const markAreas: BarChartProps['markAreas'] = [];
  for (let i = 0; i < uniqueDates.length; i += 2) {
    const start = dateTypeMap[uniqueDates[i]];
    const end = dateTypeMap[uniqueDates[i + 1]];
    if (start && end) {
      markAreas.push({
        x: [start, end],
        color: '#f5f5f5',
        label: '',
      });
    }
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip size="small" color="success" label="+35%" />
          </Stack>

          <Select
            size="small"
            value={buySell}
            onChange={handleTypeChange}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </Select>
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Sales by day – last {days} day{days !== 1 ? 's' : ''}
        </Typography>

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
          markAreas={markAreas}
          {...chartConfig}
        />
      </CardContent>
    </Card>
  );
}

// Format YYYY-MM-DD to MM/DD
const formatDate = (dateType: string): string => {
  const [date] = dateType.split('_');
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
};

// Format buy/sell type for secondary x-axis
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
