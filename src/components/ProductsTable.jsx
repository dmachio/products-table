import { useEffect, useState, useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  TablePagination,
  TableSortLabel,
  Box,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import Rating from "@mui/material/Rating";
import Tooltip from "@mui/material/Tooltip";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import React from "react";
import Skeleton from "@mui/material/Skeleton";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterListIcon from "@mui/icons-material/FilterList";
import Popover from "@mui/material/Popover";
import Autocomplete from "@mui/material/Autocomplete";
import { formatPrice, getQueryParam } from "../utils/utils";

// =====================
// Constants
// =====================
const DEBOUNCE_DELAY = 400;
const DEFAULT_ORDER_BY = "title";
const DEFAULT_ORDER = "asc";
const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;

const headCells = [
  {
    id: "title",
    label: "Product",
  },
  {
    id: "category",
    label: "Category",
  },
  {
    id: "price",
    label: "Price",
    align: "right",
  },
  {
    id: "rating",
    label: "Rating",
    align: "right",
  },
];

// =====================
// Render Helpers (Subcomponents)
// =====================
function EmptyTable() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={headCells.length} align="center">
          No products found.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function CustomPaginationActions(props) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleBack = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNext = (event) => {
    onPageChange(event, page + 1);
  };

  return (
    <>
      <Tooltip title="Previous Page">
        <span>
          <IconButton
            onClick={handleBack}
            disabled={page === 0}
            aria-label="previous page"
            size="small"
          >
            <KeyboardArrowLeft />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Next Page">
        <span>
          <IconButton
            onClick={handleNext}
            disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            aria-label="next page"
            size="small"
          >
            <KeyboardArrowRight />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}

function LoadingTable() {
  return (
    <TableBody>
      <TableRow>
        {headCells.map((headCell, idx) => (
          <TableCell key={headCell.id || idx} align={headCell.align}>
            <Skeleton variant="rectangular" height={32} />
          </TableCell>
        ))}
      </TableRow>
    </TableBody>
  );
}

function ErrorTable({ errorMessage }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell
          colSpan={headCells.length}
          align="center"
          sx={{ color: "error.main" }}
        >
          {errorMessage}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function ProductsTableBody({ products, categoriesBySlug }) {
  return (
    <TableBody>
      {products.map((product) => (
        <TableRow
          key={product.id}
          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
          hover
        >
          <TableCell component="th" scope="row">
            {product.title}
          </TableCell>
          <TableCell sx={{ minWidth: 160, maxWidth: 240, width: 200 }}>
            {categoriesBySlug[product.category]?.name ?? product.category}
          </TableCell>
          <TableCell align="right">{formatPrice(product.price)}</TableCell>
          <TableCell align="right">
            <Tooltip title={`${product.rating} out of 5`} placement="top" arrow>
              <span>
                <Rating value={product.rating} precision={0.01} readOnly />
              </span>
            </Tooltip>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function ProductsTableSearch({ search, onSearchChange }) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="Search Products"
        variant="outlined"
        fullWidth
        size="small"
        value={search}
        onChange={onSearchChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange({ target: { value: "" } })}
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
        sx={{ maxWidth: 320 }}
        helperText="Type at least 2 characters to search"
      />
    </Box>
  );
}

function ProductsTablePaginationFeedback({ loading, start, end, total }) {
  return (
    <Box sx={{ mb: 1, ml: 0.5, minHeight: 24 }}>
      {!loading && (
        <Typography variant="body2" color="text.secondary">
          {`Showing ${start}–${end} of ${total} products`}
        </Typography>
      )}
      {loading && <Skeleton variant="text" width={180} height={24} />}
    </Box>
  );
}

function ProductsTableHead({
  orderBy,
  order,
  onSort,
  categories,
  categoriesBySlug,
  selectedCategory,
  onCategoryChange,
  categoriesLoaded,
}) {
  // Popover state for category filter
  const [anchorEl, setAnchorEl] = React.useState(null);
  const inputRef = React.useRef(null);
  const handlePopoverEntered = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell align={headCell.align} key={headCell.id}>
            <Tooltip
              title={
                orderBy === headCell.id
                  ? `Sorted ${order === "asc" ? "ascending" : "descending"}`
                  : "Sort"
              }
              arrow
            >
              <span>
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={() => onSort(headCell.id)}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </span>
            </Tooltip>
            {headCell.id === "category" && categoriesLoaded && (
              <>
                <Tooltip title="Filter by category" arrow>
                  <span>
                    <IconButton
                      color="default"
                      size="small"
                      aria-label="Filter categories"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                      {selectedCategory ? (
                        <FilterAltIcon />
                      ) : (
                        <FilterListIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Popover
                  id="filter-popover"
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
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
                            ? {
                                id: selectedCategory,
                                label: categoriesBySlug[selectedCategory].name,
                              }
                            : null
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        onChange={(_, value) => {
                          onCategoryChange(value ? value.id : null);
                          setAnchorEl(null);
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
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function ProductsTablePagination({
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
}) {
  return (
    <TablePagination
      rowsPerPageOptions={[5, 10, 25]}
      component="div"
      count={total}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      ActionsComponent={CustomPaginationActions}
    />
  );
}

// =====================
// Utility Functions
// =====================
/**
 * Builds the URL for fetching products based on filters, sorting, and pagination.
 * @param {Object} params
 * @param {string} params.search - Search query string
 * @param {string|null} params.selectedCategory - Selected category slug
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.order - Order direction ('asc' or 'desc')
 * @param {number} params.page - Current page number
 * @param {number} params.rowsPerPage - Number of rows per page
 * @returns {URL} The constructed URL object
 */
function buildProductsUrl({
  search,
  selectedCategory,
  orderBy,
  order,
  page,
  rowsPerPage,
}) {
  let url;
  if (search && search.length >= 2) {
    url = new URL("https://dummyjson.com/products/search");
    url.searchParams.set("q", search);
  } else if (selectedCategory) {
    url = new URL(
      `https://dummyjson.com/products/category/${selectedCategory}`
    );
  } else {
    url = new URL("https://dummyjson.com/products");
  }
  url.searchParams.set("select", "id,title,category,price,rating");
  url.searchParams.set("limit", rowsPerPage);
  const skip = page * rowsPerPage;
  url.searchParams.set("skip", skip);
  url.searchParams.set("sortBy", orderBy);
  url.searchParams.set("order", order);
  return url;
}

/**
 * Syncs the browser URL with the current table state (pagination, sorting, filters, search).
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.rowsPerPage
 * @param {string} params.order
 * @param {string} params.orderBy
 * @param {string|null} params.selectedCategory
 * @param {string} params.search
 */
function syncUrlWithState({
  page,
  rowsPerPage,
  order,
  orderBy,
  selectedCategory,
  search,
}) {
  const params = new URLSearchParams();
  if (page !== DEFAULT_PAGE) params.set("page", page);
  if (rowsPerPage !== DEFAULT_ROWS_PER_PAGE)
    params.set("rowsPerPage", rowsPerPage);
  if (order !== DEFAULT_ORDER) params.set("order", order);
  if (orderBy !== DEFAULT_ORDER_BY) params.set("orderBy", orderBy);
  if (selectedCategory) params.set("category", selectedCategory);
  if (search.length >= 2) params.set("search", search);
  const newUrl =
    params.size > 0
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

/**
 * Fetches products from the API using the provided filters, sorting, and pagination.
 * @param {Object} params
 * @param {string} params.search
 * @param {string|null} params.selectedCategory
 * @param {string} params.orderBy
 * @param {string} params.order
 * @param {number} params.page
 * @param {number} params.rowsPerPage
 * @param {AbortSignal} params.signal - Abort signal for fetch cancellation
 * @returns {Promise<Object>} The response JSON from the API
 */
async function fetchProducts({
  search,
  selectedCategory,
  orderBy,
  order,
  page,
  rowsPerPage,
  signal,
}) {
  const url = buildProductsUrl({
    search,
    selectedCategory,
    orderBy,
    order,
    page,
    rowsPerPage,
  });
  const response = await fetchWithRetry(url, { signal });
  return response.json();
}

// =====================
// Main Component
// =====================
export default function ProductsTable() {
  // ---------------------
  // State
  // ---------------------
  const searchParams = new URLSearchParams(window.location.search);
  const [tableState, setTableState] = useState({
    orderBy: getQueryParam(searchParams, "orderBy", DEFAULT_ORDER_BY),
    order: getQueryParam(searchParams, "order", DEFAULT_ORDER),
    page: Number(getQueryParam(searchParams, "page", DEFAULT_PAGE)),
    rowsPerPage: Number(
      getQueryParam(searchParams, "rowsPerPage", DEFAULT_ROWS_PER_PAGE)
    ),
    selectedCategory: getQueryParam(searchParams, "category", null),
    search: getQueryParam(searchParams, "search", ""),
  });
  const { orderBy, order, page, rowsPerPage, selectedCategory, search } =
    tableState;
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ---------------------
  // Effects
  // ---------------------
  useEffect(() => {
    setCategoriesError(false);
    const abortController = new AbortController();
    fetchWithRetry("https://dummyjson.com/products/categories", {
      signal: abortController.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setCategoriesError(true);
        console.error("FetchingCategoriesFailed", {
          error,
        });
      });
    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    syncUrlWithState({
      page,
      rowsPerPage,
      order,
      orderBy,
      selectedCategory,
      search,
    });

    const abortController = new AbortController();

    setLoading(true);

    const handler = setTimeout(() => {
      fetchProducts({
        search,
        selectedCategory,
        orderBy,
        order,
        page,
        rowsPerPage,
        signal: abortController.signal,
      })
        .then((data) => {
          setProducts(data.products);
          setTotal(data.total);
          setLoading(false);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setErrorMessage(
              "Failed to fetch products. Please check your connection or try again later."
            );
            setProducts([]);
            setTotal(0);
            console.error("FetchingProductsFailed", {
              error,
              orderBy,
              order,
              page,
              rowsPerPage,
              selectedCategory,
              search,
            });
          }
          setLoading(false);
        });
    }, DEBOUNCE_DELAY);
    return () => {
      clearTimeout(handler);
      abortController.abort();
    };
  }, [orderBy, order, page, rowsPerPage, selectedCategory, search]);

  // ---------------------
  // Handlers
  // ---------------------
  const onSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setTableState((prev) => ({
      ...prev,
      order: isAsc ? "desc" : "asc",
      orderBy: property,
      page: 0,
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTableState((prev) => ({ ...prev, search: value, page: 0 }));
    if (value.length >= 2 && selectedCategory) {
      setTableState((prev) => ({ ...prev, selectedCategory: null }));
    }
  };

  const handleCategoryChange = (cat) => {
    setTableState((prev) => ({ ...prev, selectedCategory: cat }));
    if (cat) setTableState((prev) => ({ ...prev, search: "" }));
    setTableState((prev) => ({ ...prev, page: 0 }));
  };

  // ---------------------
  // Render Logic
  // ---------------------
  const categoriesBySlug = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.slug] = category;
        return acc;
      }, {}),
    [categories]
  );

  const start = total === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min(total, (page + 1) * rowsPerPage);

  let tableBody;
  if (loading) {
    tableBody = <LoadingTable />;
  } else if (errorMessage) {
    tableBody = <ErrorTable errorMessage={errorMessage} />;
  } else if (products.length === 0) {
    tableBody = <EmptyTable />;
  } else {
    tableBody = (
      <ProductsTableBody
        products={products}
        categoriesBySlug={categoriesBySlug}
      />
    );
  }

  // ---------------------
  // Render
  // ---------------------
  return (
    <>
      <ProductsTableSearch
        search={search}
        onSearchChange={handleSearchChange}
      />
      <ProductsTablePaginationFeedback
        loading={loading}
        start={start}
        end={end}
        total={total}
      />
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table
          sx={{ tableLayout: "fixed" }}
          aria-label="products table"
          stickyHeader
        >
          <ProductsTableHead
            orderBy={orderBy}
            order={order}
            onSort={onSort}
            categories={categories}
            categoriesBySlug={categoriesBySlug}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoriesLoaded={!!categories.length && !categoriesError}
          />
          {tableBody}
        </Table>
      </TableContainer>
      <ProductsTablePagination
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={(_, newPage) =>
          setTableState((prev) => ({ ...prev, page: newPage }))
        }
        onRowsPerPageChange={(e) => {
          setTableState((prev) => ({
            ...prev,
            rowsPerPage: parseInt(e.target.value, 10),
            page: 0,
          }));
        }}
      />
    </>
  );
}
