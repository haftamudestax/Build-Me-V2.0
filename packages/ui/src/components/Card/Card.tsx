import { forwardRef } from "react";
import type { CardProps } from "./Card.types";
import { CardSkeleton } from "./CardSkeleton";
import { CardEmpty } from "./CardEmpty";
import { CardError } from "./CardError";
import { sizeStyles } from "./Card.types";

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      state = "default",
      size = "md",
      onRetry,
      emptyMessage,
      errorMessage,
      ...props
    },
    ref,
  ) => {
    const isDisabled = state === "disabled";

    return (
      <div
        ref={ref}
        aria-disabled={isDisabled}
        className={`rounded-lg border border-gray-200 bg-white shadow-sm ${sizeStyles[size]} ${
          isDisabled ? "opacity-50 pointer-events-none grayscale" : ""
        } ${className ?? ""}`}
        {...props}
      >
        {state === "loading" && <CardSkeleton />}
        {state === "empty" && (
          <CardEmpty message={emptyMessage ?? "Nothing here yet."} />
        )}
        {state === "error" && (
          <CardError
            message={errorMessage ?? "Something went wrong."}
            onRetry={onRetry}
          />
        )}
        {(state === "default" || state === "disabled") && children}
      </div>
    );
  },
);
