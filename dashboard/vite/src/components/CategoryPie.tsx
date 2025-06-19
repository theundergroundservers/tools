import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { CATEGORY_COLORS } from '../internals/data/colors';
import { fetchCategoryData } from '../internals/data/fetchCategoryData';
import type { CategoryDataItem } from '../internals/data/fetchCategoryData';

interface ByCategoryPieProps {
  days?: number;
  title?: string;
  buySell?: string;
}

export default function ByCategoryPie({
  days = 999,
  title = 'By category',
  buySell = 'all',
}: ByCategoryPieProps) {
  const [data, setData] = useState<CategoryDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCategoryData(days, buySell)
      .then(setData)
      .finally(() => setLoading(false));
  }, [days, buySell]);

  if (loading) return <p>Loading...</p>;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(total);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="h4">{formattedTotal}</Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Last {days} day{days !== 1 ? 's' : ''}
          </Typography>
        </Stack>
        <PieChart
          series={[
            {
              data: data.map((item) => ({
                ...item,
                color: CATEGORY_COLORS[item.label] || '#999',
              })),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}