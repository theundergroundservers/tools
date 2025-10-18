import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const apiUrl = import.meta.env.VITE_API_URL;

export interface GroupSalesRow {
  player_group: string | null;
  total_buy: number;
  total_sell: number;
  net: number;
  total_members: number;
  description?: string | null;
}

const currency = (n: number) =>
  n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const numberFmt = (n: number) => (n == null ? "—" : n.toLocaleString());

const groupLabel = (g: string | null) => (g && g.trim().length > 0 ? g : "(No Group)");

async function fetchGroupSales(signal?: AbortSignal): Promise<GroupSalesRow[]> {
  const res = await fetch(`${apiUrl}api/group_sales`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as GroupSalesRow[];
  return data.map((r) => ({
    ...r,
    total_buy: Number(r.total_buy),
    total_sell: Number(r.total_sell),
    net: Number(r.net),
    total_members: Number(r.total_members),
  }));
}

export default function GroupSalesDashboard() {
  const [rows, setRows] = useState<GroupSalesRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // UI controls
  const [category, setCategory] = useState<string>("all");
  const [topN, setTopN] = useState<number>(12);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupSales();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);



    // MUI Data Grid column definitions
    const columns: GridColDef[] = [
        { field: 'player_group', headerName: 'Group', flex: 1, minWidth: 160 },
        { field: 'total_members', headerName: 'Members', flex: 0.5, minWidth: 110, type: "number" },
        { field: 'total_sell', headerName: 'Sales', flex: 0.5, minWidth: 120, type: "number"},
        { field: 'total_buy', headerName: 'Purchases', headerAlign: 'right', align: 'right', flex: 1, minWidth: 80, type: "number"},
        { field: 'net', headerName: 'Net', headerAlign: 'right', align: 'right', flex: 1, minWidth: 80, type: "number" },
        { field: 'description', headerName: 'Description', headerAlign: 'left', align: 'left', flex: 1, minWidth: 200 },
    ];


  // Build a simple category list from descriptions (best-effort until backend ships explicit categories)
  const categoryOptions = useMemo(() => {
    const base = new Set<string>(["all", "weapons", "drugs", "fishing", "vehicles", "gear", "clothing", "armor", "ammo", "medical", "food"]);
    (rows || []).forEach((r) => {
      const d = (r.description || "").toLowerCase();
      d.split(/[^a-z]+/).forEach((w) => { if (w.length > 2) base.add(w); });
    });
    return Array.from(base).slice(0, 30); // keep it tidy
  }, [rows]);

  // Filter rows by selected category word (substring match in description)
  const filteredRows = useMemo(() => {
    if (!rows) return [] as GroupSalesRow[];
    if (category === "all") return rows;
    const needle = category.toLowerCase();
    return rows.filter((r) => (r.description || "").toLowerCase().includes(needle));
  }, [rows, category]);

  const chartData = useMemo(() => {
    const src = filteredRows;
    return [...src]
      .sort((a, b) => b.total_sell - a.total_sell)
      .slice(0, topN)
      .map((r) => ({
        name: groupLabel(r.player_group),
        Buy: r.total_buy,
        Sell: r.total_sell,
        Total: r.total_buy + r.total_sell,
      }));
  }, [filteredRows, topN]);

  const totalSell = useMemo(() => filteredRows.reduce((acc, r) => acc + (r.total_sell || 0), 0), [filteredRows]);
  const totalBuy  = useMemo(() => filteredRows.reduce((acc, r) => acc + (r.total_buy || 0), 0), [filteredRows]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Group Sales Overview</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`Total Sell: ${currency(totalSell)}`} variant="outlined" />
          <Chip label={`Total Buy: ${currency(totalBuy)}`} variant="outlined" />
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Card sx={{ mb: 2, borderColor: "error.light", borderWidth: 1, borderStyle: "solid" }}>
          <CardHeader title="Error" />
          <CardContent><Typography color="error.main">{error}</Typography></CardContent>
        </Card>
      )}

      {/* Controls */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ width: { xs: "100%", sm: 260 } }}>
          <InputLabel id="cat-label">Filter by Category</InputLabel>
          <Select labelId="cat-label" label="Filter by Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt === "all" ? "All categories" : opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: { xs: "100%", sm: 180 } }}>
          <InputLabel id="topn-label">Top N</InputLabel>
          <Select labelId="topn-label" label="Top N" value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
            {[5, 10, 12, 15, 20, 30].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: 420 }}>
            <CardHeader title="Top Groups (Buy vs Sell)" subheader={`Top ${topN} groups by total sell`} />
            <CardContent sx={{ height: 360 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 320 }}><CircularProgress /></Stack>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                    <ReTooltip formatter={(v: any) => currency(Number(v))} />
                    <Legend />
                    <Bar dataKey="Buy" fill="#42a5f5" />   {/* Blue for Buy */}
                    <Bar dataKey="Sell" fill="#66bb6a" />  {/* Green for Sell */}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: 420 }}>
            <CardHeader title="Group Mix" subheader="Members, descriptors, and net" />
            <CardContent>
              <Stack spacing={1.5} sx={{ maxHeight: 330, overflow: "auto", pr: 1 }}>
                {(filteredRows ? [...filteredRows].sort((a, b) => b.total_sell - a.total_sell) : [])
                  .slice(0, 100)
                  .map((r, idx) => (
                    <Box key={`${groupLabel(r.player_group)}-${idx}`} sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.5 }}>
                      <Typography fontWeight={600}>{groupLabel(r.player_group)}</Typography>
                      <Typography variant="body2" color="text.secondary">{numberFmt(r.total_members)} members</Typography>
                      <Typography variant="body2" gridColumn="1 / -1">{r.description || "No description."}</Typography>
                      <Stack direction="row" spacing={1} gridColumn="1 / -1">
                        <Chip size="small" label={`Sell ${currency(r.total_sell)}`} />
                        <Chip size="small" label={`Buy ${currency(r.total_buy)}`} />
                        <Chip size="small" label={`Net ${currency(r.net)}`} />
                      </Stack>
                      <Divider sx={{ gridColumn: "1 / -1", my: 1 }} />
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="All Groups" subheader="Sortable & filterable table" />
            <Divider />
            <Box >
              <DataGrid
                rows={(filteredRows || []).map((r, idx) => ({ id: idx, ...r }))}                                                
                columns={columns as GridColDef[]}
                density="compact"
                disableRowSelectionOnClick
                getRowId={(r) => r.id}
                sx={{ border: 0 }}
              />              
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
