// the name of this file is ".controller.js" but it can also be ".js", its just for a personal reference

// importing the APIresponse method
import { APIresponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"

// writing a health check method
/*
const healthcheck = async (req, res, next) => {
    // using try catch in case of errors
    try {
        // getting some users
        const user = await getuserfromDB()
        // sending the response with "200" as status code using ".json method"
        res.status(200).json(
            // inside json method, creating new API response, as APIresponse is a class so we will just 
            //     create an object
            new APIresponse(200, {message: "Server is running!"})
        )
    } catch (error) {
        next(error) // next is used for middleware, its an express's built in error handler
    }
}
 */

const healthcheck = asyncHandler(async (req, res) => {
    res.status(200).json(
        // inside json method, creating new API response, as APIresponse is a class so we will just 
        //     create an object
        new APIresponse(200, {message: "Server is running!"})
    )
})

// export the method so that anybody can use it
export { healthcheck }