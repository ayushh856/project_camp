// the initial boilerplate is going to be exactly same as the one in "healthcheck.routes.js"

import {Router} from "express";
import {registerUser, 
        login, 
        logout, 
        getCurrentUser, 
        verifyEmail, 
        resendEmailVerification, 
        refreshAccessToken, 
        forgotPasswordRequest,
        resetForgotPasswordRequest,
        changeCurrentPassword
} from "../controllers/auth.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator } from "../validators/index.js";
import { userLoginValidator } from "../validators/index.js";

const router = Router()
// we'll use the "router" and we'll say i have a route for you which is "/register", this will be a "post" 
//     route instead of a "get" and the functionality we're giving is the "registerUser"

// "express-validator" part - 
//     the request has reached to the route "/register", now it is waiting to be processed by "registerUser", 
//     so we want to intercept in between and process it, so we'll put {userRegisterValidator(), validate,} 
//     this amount of code in the "post" method
// NOTE - earlier it was just "post(registerUser)"
// "userRegisterValidator()" is a function to collect the errors
// we pass the errors to "validate" to validate them, its a middleware

// Unsecured routes

router.route("/register").post(userRegisterValidator(), validate, registerUser)
router.route("/login").post(userLoginValidator(), validate, login)
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPasswordRequest);


// Secured routes

// we can only logout a user, who is logged in
// so use another middleware "verifyJWT" from "auth.middleware" for this
router.route("/logout").post(verifyJWT, logout)
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  );
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);

export default router
