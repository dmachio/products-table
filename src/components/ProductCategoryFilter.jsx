import { useState, useRef } from "react";
import { Autocomplete, Box, Popover, Paper, TextField, IconButton, Tooltip } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function ProductCategoryFilter({
  categories,
  categoriesBySlug,
  selectedCategory,
  setSelectedCategory,
  setPage,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);

  const handlePopoverEntered = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <Tooltip title="Filter by category" arrow>
        <span>
          <IconButton
            color="default"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            aria-label="Filter categories"
          >
            {selectedCategory ? <FilterAltIcon /> : <FilterListIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        id="filter-popover"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{
          transition: { onEntered: handlePopoverEntered },
        }}
      >
        <Box>
          <Paper>
            <Autocomplete
              openOnFocus
              options={categories.map((category) => ({
                id: category.slug,
                label: category.name,
              }))}
              sx={{ width: 300 }}
              value={
                selectedCategory && categoriesBySlug[selectedCategory]
                  ? { id: selectedCategory, label: categoriesBySlug[selectedCategory].name }
                  : null
              }
              isOptionEqualToValue={(option, value) =>
                option.id === value.id
              }
              onChange={(_, value) => {
                setSelectedCategory(value ? value.id : null);
                setPage(0);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product Category"
                  inputRef={inputRef}
                />
              )}
            />
          </Paper>
        </Box>
      </Popover>
    </>
  );
} 