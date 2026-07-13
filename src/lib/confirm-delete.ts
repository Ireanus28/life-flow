import { toast } from "sonner";

/**
 * Shows an inline toast asking the user to confirm a delete (Yes/No) instead
 * of deleting immediately on click — so a stray tap on a trash icon can't
 * silently remove a task/reminder/memory the user still wanted.
 */
export function confirmDelete(itemLabel: string, onConfirm: () => void) {
  toast(`Delete "${itemLabel}"?`, {
    description: "This action cannot be undone.",
    duration: 8000,
    action: { label: "Yes, delete", onClick: onConfirm },
    cancel: { label: "No", onClick: () => {} },
  });
}
