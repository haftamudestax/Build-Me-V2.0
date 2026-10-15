import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { Container } from "../Container/Container";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          py: 4,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
