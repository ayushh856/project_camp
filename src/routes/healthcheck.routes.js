import { Router } from "express";
// the logic of the health check comes from the controllers and goes into the routes
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router()
// having a get method on the route, and that method is serving the method "healthcheck"
router.route("/").get(healthcheck)

export default router