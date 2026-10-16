import { Container as MuiContainer, type ContainerProps } from "@mui/material";

export function Container(props: ContainerProps) {
  return <MuiContainer {...props} maxWidth="lg" />;
}

export type { ContainerProps };
