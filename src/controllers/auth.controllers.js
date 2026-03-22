import { User } from "../models/user.model.js"
import { APIresponse } from "../utils/api-response.js"
import { APIerror } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"
import { emailVerification, sendEmail } from "../utils/mail.js"
import jwt from "jsonwebtoken"

// writing code for generating "Access" and "Refresh" tokens after registering user in the mongoDB
const generateAccessandRefreshtoken = async (userId) => {
    try {
        // first finding the user
        const user = await User.findById(userId)
        // then generating the tokens
        const accessToken = user.generateAccesstoken()
        const refreshToken = user.generateRefreshtoken()

        // now accessing and storing the refresh tokens in the database because there is a "refreshtoken" 
        //     field in the database
        user.refreshToken = refreshToken
        // turning off the validatebeforesave because we have touched just one field and we do not want to 
        //     run validations of all the fields
        await user.save({validateBeforeSave: false})

        // returning the tokens
        return {accessToken, refreshToken}

    } catch (error) {
        // throwing error if token is not generated
        throw new APIerror(500, "Something went wrong while generating Access token!")
    }
}

// wrapping in asyncHandler to avoid writing too many try-catches
const registerUser = asyncHandler(async (req, res) => {
    // for accepting data from frontend, data will come from "body"
    const {email, username, password, role} = req.body

    // checking in the DB if the user already exists, use "findOne" method
    // since this is a database call
    const existingUser = await User.findOne({
        // either a username or an email already exists, we don't want to proceed
        $or: [{username},{email}]
    })

    // validating the user
    // if the user data (username or email) already exists then throw error
    if(existingUser) {
        throw new APIerror(409, "User with this email/username already exists!", [])
    }

    // if the user is new, then save the user details in the database
    const user = await User.create({
        username,
        email,
        password,
        isemailverified: false, // by default it should be false
    })

    // now we need to send an email to the user
    // first generate "Temporary token" to send to the user, use the method from "user.models.js" file
    // the method returns these (unHashedtoken, hashedtoken, tokenexpiry)
    const {unHashedtoken, hashedtoken, tokenexpiry} = user.generateTemporarytoken()

    // storing the "unHashedtoken" token
    user.emailverificationtoken = hashedtoken
    user.emailverificationtokenexpiry = tokenexpiry

    // saving all the details of the user
    await user.save({validateBeforeSave: false})

    // writing code to send an email to the user so that tokens can be sent to the user
    await sendEmail( // provide all the options
        {
            email: user?.email,
            subject: "Please verify your email!",
            // provide a content as well
            // remember that in our "mail.js" we are expecting that somebody gives us the "mailgenContent"
            // to generate the mailgenContent, use "emailVerification()" method from "mail.js"
            //     this method takes two parameters, the username is easy, but the verificationURL is tricky
            //         for generating proper email link, its different when website is hosted on "vercel" 
            //         or something and when we run it on "localhost" then its different
            //     so we are going to dynamically generate the link
            mailgenContent: emailVerification(
                user.username,
                // for the request we will access the protocol (is it http or https) and then get the 
                //     host
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedtoken}`
                // we will be sending the above link to the user
            )
        }
    )

    // the "user" has all of the data (such as avatar, username, email, fullname, password etc.), you don't 
    //     need to send all of this data
    // writing code to send limited amount of data
    const createdUser = await User.findById(user._id).select(
        // the select method does that it takes a string and you provide a '-' before the property then 
        //     it will be removed
        "-password -refreshtoken -emailverificationtoken -emailverificationtokenexpiry"
    )

    // verify if we have some data or not, if user not created throw an erro
    if(!createdUser) {
        throw new APIerror(500, "Something went wrong while registering the user!")
    }

    // now sending response back to the user after all the things are done
    return res
        .status(201)
        .json(
            // sending new API response
            new APIresponse(
                200,
                {user: createdUser},
                "User registration successfull! An verification email has been sent on your email!"
            )
        )
})

const login = asyncHandler(async (req, res) => {
    // taking data from frontend
    const {email, password, username} = req.body

    if(!email) {
        throw new APIerror(400, "Email is required!")
    }

    // finding the user based on email
    const user = await User.findOne({email})
    if(!user) {
        throw new APIerror(400, "User does.t exist!")
    }

    // if user exist check the password, using the "isPasswordCorrect()" method from "user.model.js"
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new APIerror(400, "Invalid password!")
    }

    // if password is correct, generate tokens (access and refresh), use "generateAccessandRefreshtoken()" 
    const {accessToken, refreshToken} = await generateAccessandRefreshtoken(user._id)

    // since cookies are not there in mobiles, so we have to send the data on our own but not unnecessary data
    
    const loggedinUser = await User.findById(user._id).select(
        // the select method does that it takes a string and you provide a '-' before the property then 
        //     it will be removed
        "-password -refreshtoken -emailverificationtoken -emailverificationtokenexpiry"
    )

    // now we want to send the data in the cookies
    // cookies requires options
    const options = {
        httpOnly: true,
        secure: true
    }

    // returning response
    return res
        .status(200)
        // accessing the cookie
        .cookie("accessToken", accessToken, options) // the first cookie we access is "accessToken"
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIresponse(
                200,
                // sending some data as well
                {
                    user: loggedinUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully!"
            )
        )
})

const logout = asyncHandler(async (req, res) => {
    // to logout a user, we have to get away the information (refresh token) from the database
    await User.findByIdAndUpdate(
        req.user._id,
        // we want to change a value and for that "$set" is used
        {
            $set: {
                refreshToken: "", // setting it to empty
            }
        },
        {
            new: true, // once the previous operation is done, give the most updated object or newer object
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIresponse(200, {}, "Logged out successfully!"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new APIresponse(
                200,
                req.user,
                "Curent user fetched successfully!"
            )
        )
})

const verifyEmail = asyncHandler(async (req, res) => {
    // first take the data
    // "req.params" gives the access of the URL itself
    const {verificationToken} = req.params

    if(!verificationToken) {
        throw new APIerror(400, "Email verification token missing!")
    }

    // once we have this token we have to hash it again, after hashing it should give the same token
    let hashedtoken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailverificationtoken: hashedtoken,
        // this field should be greater than now, if the date is in the past that means 20 mins are over 
        //      and token is invalid
        emailverificationtokenexpiry: {$gt: Date.now()}
    })

    if(!user) {
        throw new APIerror(400, "Token is invalid or expired!")
    }

    // removing unnecessary data
    user.emailverificationtoken = undefined
    user.emailverificationtokenexpiry = undefined

    user.isemailverified = true
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new APIresponse(
                200,
                {isemailverified: true},
                "Email verified!"
            )
        )
})

const resendEmailVerification = asyncHandler(async (req, res) => {
    // only send to the user who's logged in
    const user = await User.findById(req.user?._id)

    if(!user) {
        throw new APIerror(404, "User doesn't exists!")
    }

    // if user already verified
    if(user.isemailverified) {
        throw new APIerror(404, "User already verified!")
    }

    // verify the user if not verified, code taken from above method "registerUser"
    
    const {unHashedtoken, hashedtoken, tokenexpiry} = user.generateTemporarytoken()

    // storing the "unHashedtoken" token
    user.emailverificationtoken = hashedtoken
    user.emailverificationtokenexpiry = tokenexpiry

    // saving all the details of the user
    await user.save({validateBeforeSave: false})

    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email!",
            mailgenContent: emailVerification(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedtoken}`
            )
        }
    )

    return res
        .status(200)
        .json(
            new APIresponse(
                200,
                {},
                "Mail has been sent to the Email id!"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // refresh token needs to come either from cookies or body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new APIerror(401, "Unauthorized access!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user) {
            throw new APIerror(401, "Invalid refresh token!")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new APIerror(401, "Refresh token is expired!")
        }
        // if all these check are good, then we can generate new token

        const options = {
            httpOnly: true,
            secure: true
        }

        // generate access token based on id
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessandRefreshtoken(user?._id)

        // updating tokens in the database
        user.refreshToken = newRefreshToken
        await User.save() // save the user

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new APIresponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed!"
                )
            )
    } catch (error) {
        throw new APIerror(401, "Invalid refresh token!")
    }
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    // we receive an email in the body
    const {email} = req.body

    // search the user in the database
    const user = await User.findOne({email})

    if(user) {
        throw new APIerror(404, "User doesn't exist!")
    }

    // keep the "unHashedtoken" onto the email and the "hashedtoken" and "tokenexpiry" goes to the daatbase
    const {unHashedtoken, hashedtoken, tokenexpiry} = user.generateTemporarytoken()

    user.forgotpasswordtoken = hashedtoken
    user.forgotpasswordtokenexpiry = tokenexpiry

    await user.save({validateBeforeSave: false})

    // now send user an email
    await sendEmail({
        email: user?.email,
            subject: "Password reset request!",
            mailgenContent: forgotPassword(
                user.username,
                `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedtoken}`
            )
    })

    return res
            .status(200)
            .json(
                new APIresponse(
                    200,
                    {},
                    "Password reset mail has been sent to your mail id!"
                )
            )
})

const resetForgotPasswordRequest = asyncHandler(async (req, res) => {
    // this time we are getting the data from two places, i.e. "params" (means from URL) and from "body"
    const {resetToken} = req.params
    const {newPassword} = req.body

    // the "resetToken" is unhashed so we have to get the hashed token
    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    // now we need to find the user based on hashed token
    const user = await User.findOne({
        forgotpasswordtoken: hashedToken,
        forgotpasswordtokenexpiry: {$gt: Date.now()}
    })

    if(!user) {
        throw new APIerror(489, "Token is invalid or expired!")
    }

    // remove the unnecessary data from database
    user.forgotpasswordtoken = undefined
    user.forgotpasswordtokenexpiry = undefined

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
            .status(200)
            .json(
                new APIresponse(
                    200,
                    {},
                    "Password reset successfully!"
                )
            )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    // check whether the old password matches
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordValid) {
        throw new APIerror(400, "Invalid old password")
    }

    // save the new password
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
            .status(200)
            .json(
                new APIresponse(
                    200,
                    {},
                    "Password changed successfully!"
                )
            )
})

export { 
        registerUser, 
        login, 
        logout, 
        getCurrentUser, 
        verifyEmail, 
        resendEmailVerification, 
        refreshAccessToken, 
        forgotPasswordRequest,
        resetForgotPasswordRequest,
        changeCurrentPassword
    }