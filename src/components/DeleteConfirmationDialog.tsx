/**
 * DeleteConfirmationDialog.tsx
 *
 * @copyright 2026 Digital Aid Seattle
 */
import { Button, Dialog, DialogActions, DialogContent, Stack, Typography } from "@mui/material";

interface DeleteConfirmationDialogProps {
  title?: string;
  message: string;
  open: boolean;
  handleConfirm: () => void;
  handleCancel: () => void;
  confirmLabel?: string;
}

// The shared library's ConfirmationDialog hardcodes a green "OK" button, so delete actions use this variant instead to keep the destructive action red and labeled "Delete".
export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  title = "Confirm",
  message,
  open,
  handleConfirm,
  handleCancel,
  confirmLabel = "Delete",
}) => {
  return (
    <Dialog fullWidth open={open} onClose={handleCancel}>
      <DialogContent>
        <Stack gap={2}>
          <Typography variant="h4">{title}</Typography>
          <Typography>{message}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
