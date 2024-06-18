const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

router.post("/login", authController.login)
router.post("/signup", authController.signUp)
router.post('/verify-otp', authController.verifyOtp);


module.exports = router