import express from "express";
import { 
    sendAnonymousMessage, 
    getAnonymousMessages, 
    getAnonymousChatStatus,
    getAllAnonymousChats,
    initializeAnonymousChat
} from "../controllers/anonChatController.js";

const router = express.Router();

const anonChatRoutes = (io) => {
    router.post("/init", (req, res) => {
        req.io = io;
        initializeAnonymousChat(req, res);
    });
    router.post("/message", (req, res) => {
        req.io = io;
        sendAnonymousMessage(req, res);
    });
    router.get("/:anon_customer_id/messages", getAnonymousMessages);
    router.get("/:anon_customer_id/status", getAnonymousChatStatus);
    router.get("/all", getAllAnonymousChats);
    
    return router;
};

export default anonChatRoutes;
