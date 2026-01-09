import express from "express";
import { 
    sendAnonymousMessage, 
    getAnonymousMessages, 
    getAnonymousChatStatus 
} from "../controllers/anonChatController.js";

const router = express.Router();

const anonChatRoutes = (io) => {
    router.post("/message", sendAnonymousMessage);
    router.get("/:anon_customer_id/messages", getAnonymousMessages);
    router.get("/:anon_customer_id/status", getAnonymousChatStatus);
    
    return router;
};

export default anonChatRoutes;
