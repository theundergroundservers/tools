import type { GridColDef } from '@mui/x-data-grid';

export const columns: GridColDef[] = [  
  {
    field: 'str_date',
    headerName: 'Date',
    flex: 0.5,
    minWidth: 80,    
  },
  {
    field: 'str_time',
    headerName: 'Time',
    flex: 0.5,
    minWidth: 80,    
  },  
  {
    field: 'player',
    headerName: 'Player',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 80,
  },
  {
    field: 'type',
    headerName: 'BUY/SELL',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 80,
  },  
  {
    field: 'market',
    headerName: 'Market',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },   
  {
    field: 'item',
    headerName: 'Item',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'quantity',
    headerName: 'Quantity',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'price',
    headerName: 'Price',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },  
  {
    field: 'zone',
    headerName: 'Zone',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },   
];

export const CATEGORY_COLORS = {
  "Weapons":      '#E69F00',  // orange
  "Fish":         '#56B4E9',  // sky blue
  "Animals":      '#009E73',  // bluish green
  "Armor & Gear": '#F0E442',  // yellow
  "Drugs":        '#D55E00',  // vermillion
  "Other":        '#CC79A7'   // reddish purple
};

export function GetRawData() {  
  return fetch('http://localhost:5000/api/raw_data')
    .then(response => response)
    .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });
}

export function GetCategoryByDays(days: number,  buySell: string) {
  const url = `http://localhost:5000/api/by_category?days=${days}&type=${buySell}`
  console.log(url)
  return fetch(url)
    .then(response => response)
    .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });
}

export function GetCategoryDaily(days: number, buySell: string) {
  const url = `http://localhost:5000/api/by_category_daily?days=${days}&type=${buySell}`
  console.log(url)
  return fetch(url)
    .then(response => response)
    .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });
}

export function GetCategoryDailyStackedByType(days: number, buySell: string) {
  const url = `http://localhost:5000/api/stacked_sales_by_day_category_type?days=${days}&type=${buySell}`
  console.log(url)
  return fetch(url)
    .then(response => response)
    .then(json => {
        return json;
      })
      .catch(error => {
        console.error(error);
      });
}