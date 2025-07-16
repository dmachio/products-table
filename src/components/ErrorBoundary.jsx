import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`ErrorBoundary${this.props.componentName ? `: ${this.props.componentName}` : ""}`, {
      error,
      errorInfo,
    });
  }

  render() {
    return this.state.hasError ? (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Paper elevation={3} sx={{ maxWidth: 480, width: "100%", p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Sorry, something went wrong while loading this page. Please try again later.
          </Alert>
        </Paper>
      </Box>
    ) : (
      this.props.children
    );
  }
}

export default ErrorBoundary; 