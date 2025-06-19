const apiUrl = import.meta.env.VITE_API_URL;

import type { GridColDef } from '@mui/x-data-grid';

// Strongly typed raw data structure
export interface RawDataItem {
    id: number;
    str_date: string;
    str_time: string;
    player: string;
    type: 'buy' | 'sell';
    market: string;
    item: string;
    quantity: number;
    price: number;
    zone: string;
}

// Async data fetcher
export async function fetchRawData(): Promise<RawDataItem[]> {
    try {
        const response = await fetch(`${apiUrl}api/raw_data`);
        const data: RawDataItem[] = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch raw data:', error);
        return [];
    }
}

// MUI Data Grid column definitions
export const columns: GridColDef[] = [
    { field: 'id', headerName: 'id', flex: 0.5, minWidth: 80 },
    { field: 'str_date', headerName: 'Date', flex: 0.5, minWidth: 120 },
    { field: 'str_time', headerName: 'Time', flex: 0.5, minWidth: 120 },
    { field: 'player', headerName: 'Player', headerAlign: 'right', align: 'left', flex: 1, minWidth: 80 },
    { field: 'type', headerName: 'BUY/SELL', headerAlign: 'right', align: 'right', flex: 1, minWidth: 80 },
    { field: 'market', headerName: 'Market', headerAlign: 'right', align: 'left', flex: 1, minWidth: 100 },
    { field: 'item', headerName: 'Classname', headerAlign: 'right', align: 'right', flex: 1, minWidth: 220 },
    { field: 'quantity', headerName: 'Qty', headerAlign: 'right', align: 'right', flex: 1, minWidth: 30 },
    { field: 'price', headerName: '$Price', headerAlign: 'right', align: 'right', flex: 1, minWidth: 100 },
    { field: 'zone', headerName: 'Zone', headerAlign: 'right', align: 'left', flex: 1, minWidth: 100 },
];