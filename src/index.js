import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js"

dotenv.config({
    path: "C:/Users/ACER/Desktop/CODING/Web_Development/PROJECT_CAMP/.env",
})

const port = process.env.PORT || 3000

// listening on ports using ".then()", ".catch()" method
connectDB()
  // when the database has successfully connected then only the server should listen to the localhost or 
  //   whatever the port is
  .then(()=>{
    app.listen(port, () => {
      console.log(`App listening on port http://localhost:${port}`)
    })
  })
  .catch((err)=>{
    console.log("Error connecting to MongoDB!", err)
    process.exit(1)
  })