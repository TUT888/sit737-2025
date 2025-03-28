# SIT737 - 2025 - Prac 2

This is a practical exercise of SIT737 (Week 2)

## Features included
- Logging with `Winston`
- Calculator services API:
  - Addition operation at `localhost:3040/add?n1={n1}&n2={n2}`
  - Subtraction operation at `localhost:3040/sub?n1={n1}&n2={n2}`
  - Multiplication operation at `localhost:3040/mul?n1={n1}&n2={n2}`
  - Division operation at `localhost:3040/div?n1={n1}&n2={n2}`
- Calculator web UI at `localhost:3040`

## How to run
- Step 1: Clone this repository branch
  ```
  git clone -b prac2 https://github.com/TUT888/sit737-2025.git
  ```
- Step 2: Install dependencies (you must have Node.js installed in your device first)
  ```
  npm install
  ```
- Step 3: Run the server:
  ```
  node index.js
  ```