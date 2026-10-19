import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ModalProps } from "./Modal.types";
import { useFocusTrap } from "./useFocusTrap";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ModalLoading, ModalError, ModalSuccess } from "./ModalStates";

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  state = "idle",
  errorMessage = "Something went wrong.",
  successMessage = "Done!",
  closeOnEscape = true,
  closeOnOverlayClick = true,
  labelledBy,
  describedBy,
  children,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useFocusTrap(containerRef, isOpen);
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen || !closeOnEscape || state === "loading") return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeOnEscape, state, onClose]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement;
    } else {
      previouslyFocused.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && state !== "loading") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleOverlayClick();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
      >
        {state === "loading" && <ModalLoading />}
        {state === "error" && (
          <ModalError message={errorMessage} onRetry={onConfirm} />
        )}
        {state === "success" && (
          <ModalSuccess message={successMessage} onClose={onClose} />
        )}
        {state === "idle" && children}
      </div>
    </div>,
    document.body,
  );
}
