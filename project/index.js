// Import and use express
const express = require("express");
const app = express();
// Serve all files in public folder
app.use(express.static(__dirname + '/public'));
// Define the port
const port = 3040;

// ------ MongoDB connection ------ //
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
client.connect()
      .then(() => {
        console.log("Connected to MongoDB")
      })
      .catch((err) => {
        console.error("Unable to connect to MongoDB: ", err);
      });

const db = client.db();
const collection = db.collection("calculation-history");

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

const exp = (n1, n2) => { return n1 ** n2; }
const sqrt = (n1, n2=0) => { return Math.sqrt(n1); }
const mod = (n1, n2) => { return n1 % n2; }
const log = (n1, n2=0) => { return Math.log(n1); }

const mapFunc = {
  "add": add,
  "sub": sub,
  "div": div,
  "mul": mul,
  "exp": exp,
  "sqrt": sqrt,
  "mod": mod,
  "log": log
}

const validateInput = (n1, n2, operation) => {
  // Log the information received from request
  logger.info(`Parameters ${n1} and ${n2} received for ${operation}`);

  // If the numbers are not defined, throw new exception
  if (isNaN(n1)) {
    throw new Error("Num 1 is incorrectly defined");
  }
  if (n1 === NaN) {
    throw new Error("Parsing Error");
  }

  // If the operation is square root, we don't need n2
  if (operation !== "square root" && operation != "logarithm") {
    if (isNaN(n2)) {
      throw new Error("Num 2 is incorrectly defined");
    }
    if (n2 === NaN) {
      throw new Error("Parsing Error");
    }
  }  

  if (operation === "division" && n2 === 0) {
    throw new Error("Zero division");
  }
}

const errorHandling = (error) => {
  console.log(error.toString());
  logger.error(error.toString());
}

// ------ Endpoint APIs: Get history ------ //
app.get("/", async (req, res) => {
  try {
    const calculationHistory = await collection.find().toArray()

    res.status(200).json({
      statuscode: 200,
      calculationHistory: calculationHistory
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

app.get("/clear", async (req, res) => {
  try {
    const result = await collection.deleteMany();

    return res.status(200).json({
      statuscode: 200,
      message: "Cleared database"
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

app.get("/update/:id", async (req, res) => {
  const { id } = req.params;
  const storedCal = await collection.findOne({ _id: new ObjectId(id) });
  if (!storedCal) {
    return res.status(400).json({
      statuscode: 400,
      message: "Calculation not found"
    });
  }

  const n1 = parseInt(req.query.n1) || storedCal.n1;
  const n2 = parseInt(req.query.n2) || storedCal.n2;
  const op = req.query.op || storedCal.operation;

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { 
        "n1": n1, 
        "n2": n2,
        "operation": op,
        "result": mapFunc[op](n1, n2)
      } }
    );
    if (result.matchedCount === 0) {
      return res.status(400).json({
        statuscode: 400,
        message: "Nothing is updated"
      });
    }

    return res.status(200).json({
      statuscode: 200,
      message: "Update successful"
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

// ------ Endpoint APIs: Advanced calculation ------ //
// Exponentiation
app.get("/exp", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "exponentiation");

    // Calculate the result and send JSON response
    const result = exp(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "exp", result: result });

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

// Square root
app.get("/sqrt", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    validateInput(n1, null, "square root");

    // Calculate the result and send JSON response
    const result = sqrt(n1);
    await collection.insertOne({ n1: n1, n2: null, operation: "sqrt", result: result });

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

// Modulo
app.get("/mod", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "modulo");

    // Calculate the result and send JSON response
    const result = mod(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "mod", result: result });

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

// Logarithm 
app.get("/log", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    validateInput(n1, null, "logarithm");

    // Calculate the result and send JSON response
    const result = log(n1);
    await collection.insertOne({ n1: n1, n2: null, operation: "log", result: result });

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

// ------ Endpoint APIs: Basic calculation ------ //
// Addition
app.get("/add", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "addition");

    // Calculate the result and send JSON response
    const result = add(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "add", result: result });

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
app.get("/sub", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "subtraction");

    // Calculate the result and send JSON response
    const result = sub(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "sub", result: result });

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
app.get("/mul", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "multiplication");

    // Calculate the result and send JSON response
    const result = mul(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "mul", result: result });

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
app.get("/div", async (req, res) => {
  try {
    // Receive and validate input numbers
    const n1 = parseFloat(req.query.n1);
    const n2 = parseFloat(req.query.n2);
    validateInput(n1, n2, "division");

    // Calculate the result and send JSON response
    const result = div(n1, n2);
    await collection.insertOne({ n1: n1, n2: n2, operation: "div", result: result });

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