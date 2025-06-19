const apiUrl = import.meta.env.VITE_API_URL;


export interface CumulativeSalesSeries {
  data: number[];
  label: string;
}

export interface CumulativeSalesApiResponse {
  xLabels: string[];
  series: CumulativeSalesSeries[];
}

export async function fetchCumulativeSales(days: number = 30): Promise<CumulativeSalesApiResponse> {
  const response = await fetch(`${apiUrl}api/cumulative_sales_by_day?days=${days}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cumulative sales: ${response.statusText}`);
  }
  const data: CumulativeSalesApiResponse = await response.json();
  return data;
}