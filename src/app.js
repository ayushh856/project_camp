// all the importings are done after the configuration of everything (such as CORS configuration)
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

// creating a variable which holds all the powers of express
const app = express()

// BASIC CONFIGURATIONS

// using json, so that anybody can send json data
app.use(express.json({limit: "16kb"})) // putting a limit on the amount of data
// we want that user should be able to send the data with the url itself, such as in URL encoding the spaces 
//     gets converted into the "%20" etc.
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// we also want to serve some static asset from out public folder (such as images)
app.use(express.static("public"))

app.use(cookieParser())

// CORS CONFIGURATION
app.use(
    cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
    })
)

// importing the routes
// since the below router is export default so we can name it whatever we want to
import healthcheckrouter from "./routes/healthcheck.routes.js"
import authRouter from "./routes/auth.routes.js"
// using a middleware so that the route where we want to serve the "healthcheck" is not the "/" and 
// instead its "/api/v1/healthcheck"
app.use("/api/v1/healthcheck", healthcheckrouter)
app.use("/api/v1/auth", authRouter)

// creating routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app