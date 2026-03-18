import { ReactNode } from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: ReactNode;
  spinnerSize?: number;
};

const LoadingButton = ({
  loading = false,
  loadingText,
  spinnerSize = 18,
  disabled,
  startIcon,
  children,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={spinnerSize} /> : startIcon}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;