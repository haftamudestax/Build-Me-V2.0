import type { ReactNode } from "react";

export type ModalState = "idle" | "loading" | "error" | "success";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  state?: ModalState;
  errorMessage?: string;
  successMessage?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  labelledBy: string;   // required — enforces a11y at the type level
  describedBy?: string;
  children: ReactNode;
}