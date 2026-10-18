const express = require("express");
const {
  getMe,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMe);
router.get("/", authorize("admin"), getUsers);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;