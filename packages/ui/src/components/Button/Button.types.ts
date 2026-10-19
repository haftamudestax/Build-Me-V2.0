
import type { ButtonProps as MuiButtonProps } from "@mui/material";

export type ButtonVariant = "primary" | "secondary" | "outlined" | "text";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<MuiButtonProps, "variant" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
