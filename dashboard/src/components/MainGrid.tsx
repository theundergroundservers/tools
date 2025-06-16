import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RawDataGrid from './RawDataGrid';
import CategoryDaily from './CategoryDaily';
import CategoryPie from './CategoryPie';
import CumulativeSalesLineChart from './CumulativeSalesLineChart';

export default function MainGrid() {
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        <Grid size={{ xs: 9, md: 9 }}>
          <CategoryDaily days={30} title="Sales per day by category" buySell='all' />
          <CumulativeSalesLineChart days={30}  />
          <RawDataGrid />
        </Grid>        
        <Grid size={{ xs: 3, md: 3 }}>
          <CategoryPie days={999} title="Purchases by category all time" buySell='buy' />
          <CategoryPie days={1} title="Sales Today Since last restart" buySell='sell' />
          <CategoryPie days={7} title="Sales Last 7 days" buySell='sell' />
          <CategoryPie days={30} title="Sales Last 30 days" buySell='sell' />
          <CategoryPie days={999} title="Sales by category all time" buySell='sell' />           
        </Grid>
      </Grid>
    </Box>
  );
}
