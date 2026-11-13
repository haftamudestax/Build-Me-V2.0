
import type { ReactNode } from "react";

export type ModalState = "idle" | "loading" | "error" | "success";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  state?: ModalState;
  size?: ModalSize;
  errorMessage?: string;
  successMessage?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
}
