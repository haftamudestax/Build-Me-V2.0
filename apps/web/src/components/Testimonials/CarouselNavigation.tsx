import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

interface CarouselNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CarouselNavigation({
  currentPage,
  totalPages,
  onPageChange,
}: CarouselNavigationProps) {
  const lastPage = Math.max(0, totalPages - 1);

  const handlePageChange = (page: number) => {
    const safePage = Math.max(0, Math.min(page, lastPage));

    if (safePage !== currentPage) {
      onPageChange(safePage);
    }
  };

  return (
    <Box
      component="nav"
      aria-label="Card pagination"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        mt: 4,
      }}
    >
      {/* Previous */}
      <IconButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 0 || totalPages <= 1}
        aria-label="Previous cards"
        size="small"
        sx={{
          color: "text.primary",
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        }}
      >
        <ArrowBackIosNewRoundedIcon fontSize="small" />
      </IconButton>

      {/* Pagination Indicators */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {Array.from({ length: Math.max(1, totalPages) }, (_, index) => (
          <Box
            key={index}
            component="button"
            type="button"
            onClick={() => handlePageChange(index)}
            aria-label={`Go to page ${index + 1}`}
            aria-current={currentPage === index ? "page" : undefined}
            sx={{
              width: currentPage === index ? 24 : 8,
              height: 8,
              p: 0,
              border: 0,
              borderRadius: 999,
              bgcolor:
                currentPage === index ? "primary.main" : "action.disabled",
              cursor: "pointer",
              transition: "all 0.25s ease",
              "&:hover": {
                bgcolor: "primary.light",
              },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 3,
              },
            }}
          />
        ))}
      </Box>

      {/* Next */}
      <IconButton
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= lastPage || totalPages <= 1}
        aria-label="Next cards"
        size="small"
        sx={{
          color: "text.primary",
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        }}
      >
        <ArrowForwardIosRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
