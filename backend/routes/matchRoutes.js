const express = require("express");
const router = express.Router();
const { matchStudents } = require("../controllers/matchController");

router.get("/match", matchStudents);

module.exports = router;
