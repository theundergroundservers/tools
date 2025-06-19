import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { columns, fetchRawData, type RawDataItem } from '../internals/data/fetchRawData';

export default function RawDataGrid() {
  const [data, setData] = useState<RawDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      const result = await fetchRawData();
      setData(result);
      setLoading(false);
    };

    loadData().catch((error) => {
      console.error('Failed to load data:', error);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <DataGrid
      rows={data}      
      columns={columns}
      getRowId={(row : RawDataItem) => row.id}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 100 } },
      }}
      pageSizeOptions={[20, 100]}      
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
  );
}
