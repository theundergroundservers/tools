import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { PieChart } from '@mui/x-charts/PieChart';
import { GetCategoryByDays, CATEGORY_COLORS } from '../internals/data/gridData';

export default function ByCategoryPie({ days = 999, title = 'By category', buySell = 'all'}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetCategoryByDays(days, buySell)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, [days]);

  if (loading) return <p>Loading...</p>;

  const total = data[0]?.data?.reduce((sum, item) => sum + item.value, 0) || 0;

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(total);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          ${' '}{title}
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {formattedTotal}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            last {days} day{days !== 1 ? 's' : ''}
          </Typography>
        </Stack>
        <PieChart 
          series={[
            {
              data: data[0]?.data.map(item => ({
                ...item,
                color: CATEGORY_COLORS[item.label] || '#999'  // fallback
              }))                     
            },
          ]}        
        />
      </CardContent>
    </Card>
  );
}