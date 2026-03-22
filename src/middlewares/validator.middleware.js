import { validationResult } from "express-validator"
import { APIerror } from "../utils/api-error.js"

// writing a logic that i will give you a file, you will extract some errors from it and process them
// since this is a middleware, most of the middlewares expect (req, res, next)
export const validate = (req, res, next) => {
    const errors = validationResult(req)
    if(errors.isEmpty()) {
        return next() // if there's no error, then do nothing
    }
    // if we have any error, we have to extract this error and pass it on in an array
    const extractedErrors = []
    // pushing the error path as well as error message
    errors.array().map((err) => extractedErrors.push(
        {
            [err.path]: err.msg
        }))
        throw new APIerror(422, "The data is not valid!", extractedErrors)
}