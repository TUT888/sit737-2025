// Import and use express
const express = require("express");
const app = express();
// Serve all files in public folder
app.use(express.static(__dirname + '/public'));
// Define the port
const port = 3040;

// ------ Logging  ------ //
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'calculator-microservice' },
  transports: [
    // Write all logs with important level of "info" or less to "combine.log"
    new winston.transports.File({ filename: 'logs/combined.log' }),

    // Write all logs with important level of "error" to "error.log"
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

// Print the log to the console if not in production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// ------ Define some core functions  ------ //
const add = (n1, n2) => { return n1 + n2; }
const sub = (n1, n2) => { return n1 - n2; }
const div = (n1, n2) => { return n1 / n2; }
const mul = (n1, n2) => { return n1 * n2; }

const validateInput = (n1, n2, operation) => {
  // Log the information received from request
  logger.info(`Parameters ${n1} and ${n2} received for ${operation}`);

  // If the numbers are not defined, throw new exception
  if (isNaN(n1)) {
    throw new Error("Num 1 is incorrectly defined");
  }
  if (isNaN(n2)) {
    throw new Error("Num 2 is incorrectly defined");
  }

  if (n1 === NaN || n2 === NaN) {
    throw new Error("Parsing Error");
  }

  if (operation === "division" && n2 === 0) {
    throw new Error("Zero division");
  }
}

const errorHandling = (error) => {
  console.log(error.toString());
  logger.error(error.toString());
}

// ------ Main entry ------ //
app.get("/", (req, res) => {
  res.render("index.html");
})

// ------ Endpoint APIs ------ //
// Addition
app.get("/add", (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "addition");

    // Calculate the result and send JSON response
    const result = add(n1, n2);
    res.status(200).json({
      statuscode: 200,
      data: result
    });
  } catch (error) {
    // Catch the thrown exception if encounter errors 
    errorHandling(error);
    res.status(500).json({
      statuscode: 500,
      msg: error.toString()
    })
  }
})

// Subtraction
app.get("/sub", (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "subtraction");

    // Calculate the result and send JSON response
    const result = sub(n1, n2);
    res.status(200).json({
      statuscode: 200,
      data: result
    });
  } catch (error) {
    // Catch the thrown exception if encounter errors 
    errorHandling(error);
    res.status(500).json({
      statuscode: 500,
      msg: error.toString()
    })
  }
})

// Multiplication
app.get("/mul", (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "multiplication");

    // Calculate the result and send JSON response
    const result = mul(n1, n2);
    res.status(200).json({
      statuscode: 200,
      data: result
    });
  } catch (error) {
    // Catch the thrown exception if encounter errors 
    errorHandling(error);
    res.status(500).json({
      statuscode: 500,
      msg: error.toString()
    })
  }
})

// Division
app.get("/div", (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "division");

    // Calculate the result and send JSON response
    const result = div(n1, n2);
    res.status(200).json({
      statuscode: 200,
      data: result
    });
  } catch (error) {
    // Catch the thrown exception if encounter errors 
    errorHandling(error);
    res.status(500).json({
      statuscode: 500,
      msg: error.toString()
    })
  }
})

// Let the server to listen to the specified port
app.listen(port, () => {
  console.log(`Hello, I am listening to ${port} `);
  console.log(`http://localhost:${port}/`)
})