import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';
import { gray, brand } from '../themePrimitives';

export const treeViewCustomizations: Components<Theme> = {
  MuiTreeItem: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        position: 'relative',
        boxSizing: 'border-box',
        padding: theme.spacing(0, 1),
        '& .groupTransition': {
          marginLeft: theme.spacing(2),
          padding: theme.spacing(0),
          borderLeft: '1px solid',
          borderColor: theme.palette.divider,
        },
        '&:focus-visible .focused': {
          outline: `3px solid ${alpha(brand[500], 0.5)}`,
          outlineOffset: '2px',
          '&:hover': {
            backgroundColor: alpha(gray[300], 0.2),
          },
        },
      }),
      content: ({ theme }: { theme: Theme }) => {
        const isDark = theme.palette.mode === 'dark';
        return {
          marginTop: theme.spacing(1),
          padding: theme.spacing(0.5, 1),
          overflow: 'clip',
          '&:hover': {
            backgroundColor: alpha(isDark ? gray[500] : gray[300], 0.2),
          },
          '&.selected': {
            backgroundColor: alpha(isDark ? gray[500] : gray[300], 0.4),
            '&:hover': {
              backgroundColor: alpha(isDark ? gray[500] : gray[300], 0.6),
            },
          },
        };
      },
    },
  },
};
