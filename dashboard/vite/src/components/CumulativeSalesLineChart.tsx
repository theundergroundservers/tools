// src/components/CumulativeSalesLineChart.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { fetchCumulativeSales, type CumulativeSalesApiResponse } from '../internals/data/fetchCumulativeSales';

const margin = { right: 24 };

export default function CumulativeSalesLineChart() {
  const [data, setData] = useState<CumulativeSalesApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCumulativeSales()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <p>Loading...</p>;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Cumulative Sales
        </Typography>
        <LineChart
          height={300}
          series={data.series}
          xAxis={[{ scaleType: 'point', data: data.xLabels }]}
          yAxis={[{ width: 60 }]}
          margin={margin}
        />
      </CardContent>
    </Card>
  );
}
