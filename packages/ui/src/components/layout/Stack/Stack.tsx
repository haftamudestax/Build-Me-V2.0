import { Stack as MuiStack, type StackProps } from "@mui/material";

export function Stack(props: StackProps) {
  return <MuiStack spacing={2} {...props} />;
}
