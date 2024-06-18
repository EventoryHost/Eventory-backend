const express = require('express')
const router = express.Router()
const catererController = require('../controllers/catererController')
const hallController = require('../controllers/marraigeHallController')

router.get("/caterer", catererController.getAllCaterers)
router.post("/add-caterer", catererController.createCaterer)

router.get("/halls", hallController.getAllHalls)
router.post("/add-hall", hallController.createHall)


module.exports = router;