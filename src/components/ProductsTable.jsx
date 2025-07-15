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
  CircularProgress,
  Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import ProductCategoryFilter from "./ProductCategoryFilter";
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

const DEBOUNCE_DELAY = 400;
const DEFAULT_ORDER_BY = "title";
const DEFAULT_ORDER = "asc";
const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;

function formatPrice(price) {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getQueryParam(searchParams, key, fallback) {
  const value = searchParams.get(key);
  return value !== null ? value : fallback;
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

export default function ProductsTable() {
  const searchParams = new URLSearchParams(window.location.search);
  const [orderBy, setOrderBy] = useState(
    getQueryParam(searchParams, "orderBy", DEFAULT_ORDER_BY)
  );
  const [order, setOrder] = useState(
    getQueryParam(searchParams, "order", DEFAULT_ORDER)
  );
  const [page, setPage] = useState(
    Number(getQueryParam(searchParams, "page", DEFAULT_PAGE))
  );
  const [rowsPerPage, setRowsPerPage] = useState(
    Number(getQueryParam(searchParams, "rowsPerPage", DEFAULT_ROWS_PER_PAGE))
  );
  const [selectedCategory, setSelectedCategory] = useState(
    getQueryParam(searchParams, "category", null)
  );
  const [search, setSearch] = useState(
    getQueryParam(searchParams, "search", "")
  );
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("https://dummyjson.com/products/categories")
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      });
  }, []);

  const categoriesBySlug = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.slug] = category;
        return acc;
      }, {}),
    [categories]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const handler = setTimeout(() => {
      setLoading(true);
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

      fetchWithRetry(url, { signal: abortController.signal })
        .then((response) => response.json())
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
              url: String(url),
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

  // Update URL when relevant state changes
  useEffect(() => {
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
  }, [page, rowsPerPage, order, orderBy, selectedCategory, search]);

  const onSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };

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

  // Pagination feedback calculation
  const start = total === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min(total, (page + 1) * rowsPerPage);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Search Products"
          variant="outlined"
          fullWidth
          size="small"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            setPage(0);
            if (value.length >= 2 && selectedCategory) {
              setSelectedCategory(null);
            }
          }}
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
                    onClick={() => {
                      setSearch("");
                      setPage(0);
                    }}
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

      <Box sx={{ mb: 1, ml: 0.5, minHeight: 24 }}>
        {loading ? (
          <Skeleton variant="text" width={180} height={24} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {`Showing ${start}–${end} of ${total} products`}
          </Typography>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table sx={{ tableLayout: "fixed" }} aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell align={headCell.align} key={headCell.id}>
                  <Tooltip
                    title={
                      orderBy === headCell.id
                        ? `Sorted ${
                            order === "asc" ? "ascending" : "descending"
                          }`
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
                  {headCell.id === "category" && (
                    <ProductCategoryFilter
                      categories={categories}
                      categoriesBySlug={categoriesBySlug}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={(cat) => {
                        setSelectedCategory(cat);
                        if (cat) setSearch("");
                      }}
                      setPage={setPage}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                {headCells.map((headCell, idx) => (
                  <TableCell key={headCell.id || idx} align={headCell.align}>
                    <Skeleton variant="rectangular" height={32} />
                  </TableCell>
                ))}
              </TableRow>
            ) : errorMessage ? (
              <TableRow>
                <TableCell
                  colSpan={headCells.length}
                  align="center"
                  sx={{ color: "error.main" }}
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  hover
                >
                  <TableCell component="th" scope="row">
                    {product.title}
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, maxWidth: 240, width: 200 }}>
                    {categoriesBySlug[product.category]?.name}
                  </TableCell>
                  <TableCell align="right">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={`${product.rating} out of 5`}
                      placement="top"
                      arrow
                    >
                      <span>
                        <Rating
                          value={product.rating}
                          precision={0.01}
                          readOnly
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        ActionsComponent={CustomPaginationActions}
      />
    </>
  );
}
