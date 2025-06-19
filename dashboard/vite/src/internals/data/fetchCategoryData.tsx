const apiUrl = import.meta.env.VITE_API_URL;

// internals/data/useCategoryData.ts
export interface CategoryDataItem {
  id: number;
  label: string;
  value: number;
}

export interface CategoryApiResponse {
  data: CategoryDataItem[];
}

export async function fetchCategoryData(
  days: number,
  buySell: string
): Promise<CategoryDataItem[]> {
  try {
    const response = await fetch(
      `${apiUrl}by_category?days=${days}&type=${buySell}`
    );
    const json: CategoryApiResponse[] = await response.json();
    return json[0]?.data ?? [];
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}
