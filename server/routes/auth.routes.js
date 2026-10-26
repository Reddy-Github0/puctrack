const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { register, login, me } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;
