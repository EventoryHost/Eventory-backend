import { Router } from "express";
const queryRoutes = Router();
import queryController from "../controllers/queryController.js";

queryRoutes.post("/create-query", queryController.createQuery);
queryRoutes.post("/create-reachout-query", queryController.createreachoutQuery);


export default queryRoutes;