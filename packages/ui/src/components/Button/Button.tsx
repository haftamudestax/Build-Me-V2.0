import { forwardRef } from "react";
import MuiButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { ButtonProps } from "./Button.types";

const variantMap = {
  primary: "contained",
  secondary: "contained",
  outlined: "outlined",
  text: "text",
} as const;

const sizeMap = {
  sm: "small",
  md: "medium",
  lg: "large",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      color,
      sx,
      ...props
    },
    ref,
  ) => {
    const muiColor = color ?? (variant === "secondary" ? "inherit" : "primary");

    return (
      <MuiButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        color={muiColor}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        sx={[
          {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            ...(variant === "secondary" && {
              bgcolor: "grey.100",
              color: "text.primary",
              "&:hover": {
                bgcolor: "grey.200",
              },
            }),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        {...props}
      >
        {loading && (
          <CircularProgress
            size={16}
            color="inherit"
            aria-label="Loading"
            sx={{ mr: children ? 1 : 0 }}
          />
        )}
        {children}
      </MuiButton>
    );
  },
);

Button.displayName = "Button";
