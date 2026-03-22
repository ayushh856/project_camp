// whenever we take the access token, we get some information from the access token as well, such as 
// {
//     _id: this._id, // generating "id" according to the format of mongoDB
//     email: this.email,
//     username: this.username,
// }

// so whenever we'll make a request to the server we will extract out this information from the 
// access token and put the information in the request

import { User } from "../models/user.model.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { APIerror } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // extracting the token
    // if we are able to access the cookie, we will access the access token or we'll access by headers 
    //      (Authorization: Bearer <token>)
    // now the the value we get from the "Authorization" is "Bearer <token>" and we don't want the "Bearer" 
    //      and the " " after that, so we'll use a javascript method "replace()" and we'll replace the 
    //      "Bearer " with nothing ("") and then we'll just remain with the token
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // throw error if you don't have token
    if (!token) {
        throw new APIerror(401, "Unauthorized request!")
    }
    // if we get token, then decode this
    try {
        // decoding the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // do a database query 
        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshtoken -emailverificationtoken -emailverificationtokenexpiry")

        if (!user) {
            throw new APIerror(401, "Invalid access token!")
        }

        req.user = user
        next() // hop on to next middleware or proceed with the controller itself
    } catch (error) {
        throw new APIerror(401, "Invalid access token!")
    }
});

export const validateProjectPermission = (roles = []) => {
    asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;

        if (!projectId) {
            throw new ApiError(400, "project id is missing");
        }

        const project = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id),
        });

        if (!project) {
            throw new ApiError(400, "project not found");
        }

        const givenRole = project?.role;

        req.user.role = givenRole;

        if (!roles.includes(givenRole)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        next();
    });
};