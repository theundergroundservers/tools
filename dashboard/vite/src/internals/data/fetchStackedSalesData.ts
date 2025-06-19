const apiUrl = import.meta.env.VITE_API_URL;

interface DataRow {
  date_type: string;
  [key: string]: string | number | Date | null | undefined;
}
  
export interface SeriesItem {
  dataKey: string;
  [key: string]: unknown;
}

export interface StackedCategoryData {
  dataset: DataRow[];
  series: SeriesItem[];
}

export async function fetchStackedCategoryData(days: number, buySell: string): Promise<StackedCategoryData> {
  const url = `${apiUrl}api/stacked_sales_by_day_category_type?days=${days}&type=${buySell}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stacked sales data: ${response.statusText}`);
  }
  return response.json();
}