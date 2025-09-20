import { Router } from "express";
import { runTest } from "../controllers/clientController.js";

const clientRouter = Router();

clientRouter.post("/run", runTest);

export default clientRouter;
