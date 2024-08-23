import { Router } from "express";
const queryRoutes = Router();
import queryController from "../controllers/queryController.js";

queryRoutes.post("/create-query", queryController.createQuery);

export default queryRoutes;
