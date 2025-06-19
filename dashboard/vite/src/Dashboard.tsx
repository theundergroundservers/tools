import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import ViewMainGrid from './components/ViewMainGrid';
import ViewPlayerGrid from './components/ViewPlayerGrid';
import ViewTraderDataGrid from './components/ViewTraderDataGrid';
import SideMenu from './components/SideMenu';
import AppTheme from './theme/AppTheme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import {
  chartsCustomizations,
  dataGridCustomizations,  
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations  
};

export default function Dashboard(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      Hello hello
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <Router>
          <SideMenu />
          <AppNavbar />
          {/* Main content */}
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
            })}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                mx: 3,
                pb: 5,
                mt: { xs: 8, md: 0 },
              }}
            >
              <Header />
              <Routes>
                <Route path="/" element={<ViewMainGrid />} />
                <Route path="/player" element={<ViewPlayerGrid />} />
                <Route path="/trader" element={<ViewTraderDataGrid />} />
              </Routes>

            </Stack>
          </Box>
        </Router>
      </Box>
    </AppTheme>
  );
}
