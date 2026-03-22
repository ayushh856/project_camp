// writing an alternative higher order function for "healthcheck"

// method which takes a request handler, which is this whole code taken from (healthcheck.controller.js) - 
// the whole code written below is an request, and that function is known as request-handler
/*
(req, res, next) => {
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

const asyncHandler = (requestHandler) => {
    // returning the whole function
    return (req, res, next) => {
        // promisifying the functions that are passed
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
        // the above part handles all the errors and pass it to the express's inbuilt error handler
    }
}

export { asyncHandler }