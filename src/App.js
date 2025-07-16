import ProductsTable from "./components/ProductsTable";
import { AppBar, Box, Paper, Toolbar, Typography } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <div className="App">
      <Box sx={{ flexGrow: 1, mb: 4 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="a"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              MyShop
            </Typography>
            <Typography variant="h6" component="div">
              Products
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>

      <Box sx={{ maxWidth: 900, mx: "auto", mb: 4 }}>
        <Paper sx={{ p: 2 }}>
          <ErrorBoundary componentName="ProductsTable">
            <ProductsTable />
          </ErrorBoundary>
        </Paper>
      </Box>
    </div>
  );
}

export default App;
