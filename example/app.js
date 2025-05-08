/**
 * Example Express application using lognexus
 */
const express = require("express");
const { log, morgan } = require("./logger-config");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add request logging middleware
app.use(morgan);

// Add JSON body parser
app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  log.info("Home route accessed");
  res.send("Welcome to the API!");
});

// Example API endpoint
app.post("/api/orders", (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    // Log the order request
    log.info("New order received", { productId, quantity, userId });

    if (!productId || !quantity || !userId) {
      log.warn("Invalid order data received", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Process order logic would go here...

    // Log successful order
    log.info("Order processed successfully", {
      orderId: "ORD-" + Date.now(),
      productId,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Order created",
      orderId: "ORD-" + Date.now(),
    });
  } catch (error) {
    // Log error with full details
    log.error("Order processing failed", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Example endpoint that might throw an error
app.get("/api/test-error", (req, res) => {
  try {
    // Simulate an error
    throw new Error("Test error for logging demonstration");
  } catch (error) {
    log.error("Test error route accessed", {
      error: error.message,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    res.status(500).send("Error logged successfully");
  }
});

// Start the server
app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });

  // This will also be captured by our logger
  console.log(`API ready at http://localhost:${PORT}`);
});

// Handle application shutdown
process.on("SIGTERM", () => {
  log.info("Application shutting down");
  process.exit(0);
});
