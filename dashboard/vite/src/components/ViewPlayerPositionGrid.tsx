import * as React from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

// ---- Bring in your existing types, fetcher, and columns ----
import type { GridColDef } from '@mui/x-data-grid';
import { columns, fetchRawData, type PlayerPosition } from '../internals/data/fetchPlayerPositionData';

// Optional: sensible defaults
const WINDOW_OPTIONS = [15, 30, 45, 60, 120]; // minutes
const RADIUS_OPTIONS = [50, 100, 250, 500, 1000, 2000]; // game units (e.g., meters)

export default function ViewPlayerPositionGrid() {
  const [when, setWhen] = React.useState<Dayjs>(dayjs());
  const [windowMinutes, setWindowMinutes] = React.useState<number>(30);
  const [radius, setRadius] = React.useState<number>(250);
  const [x, setX] = React.useState<number>(0);
  const [y, setY] = React.useState<number>(0);
  const [rows, setRows] = React.useState<PlayerPosition[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedTime = when.format('YYYY-MM-DDTHH:mm:ss');
      const data = await fetchRawData(x, y, radius, formattedTime, windowMinutes);
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={2}>      
         <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Player Positions</Typography>
          <Typography variant="h6">ALL TIMES ARE IN PACIFIC TIME!</Typography>
        </Grid>

         <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Date/Time */}
              <Grid size={{ xs: 12, md: 4 }}>
                <DateTimePicker
                  label="Date & Time"
                  value={when}
                  onChange={(v) => v && setWhen(v)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Window */}
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="window-label">Window (min)</InputLabel>
                  <Select
                    labelId="window-label"
                    value={windowMinutes}
                    label="Window (min)"
                    onChange={(e) => setWindowMinutes(Number(e.target.value))}
                  >
                    {WINDOW_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Radius */}
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="radius-label">Radius</InputLabel>
                  <Select
                    labelId="radius-label"
                    value={radius}
                    label="Radius"
                    onChange={(e) => setRadius(Number(e.target.value))}
                  >
                    {RADIUS_OPTIONS.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* X / Y coords */}
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  type="number"
                  label="X"
                  value={x}
                  onChange={(e) => setX(Number(e.target.value))}
                  fullWidth
                  
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  type="number"
                  label="Y"
                  value={y}
                  onChange={(e) => setY(Number(e.target.value))}
                  fullWidth                  
                />
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Button variant="contained" onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </Grid>

              {error && (
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography color="error" variant="body2">{error}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ width: '100%', p: 1, position: 'relative' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'background.default', opacity: 0.6, zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns as GridColDef[]}
              density="compact"
              disableRowSelectionOnClick
              getRowId={(r) => r.id}
              sx={{ border: 0 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}
