const mongoose = require("mongoose");
const User = require("../models/User");

const userResponse = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const handleError = (err, res) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Email is already registered" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
};

const isSelfOrAdmin = (req, id) =>
  req.user.role === "admin" || req.user._id.toString() === id;

// GET /api/users/me
exports.getMe = (req, res) => {
  res.json({ user: userResponse(req.user) });
};
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = {};
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users: users.map(userResponse),
    });
  } catch (err) {
    handleError(err, res);
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (!isSelfOrAdmin(req, id)) {
      return res.status(403).json({ message: "You can only view your own profile" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: userResponse(user) });
  } catch (err) {
    handleError(err, res);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (!isSelfOrAdmin(req, id)) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    const { name, email, password, role } = req.body;

    for (const [key, value] of Object.entries({ name, email, password, role })) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({ message: `${key} must be a string` });
      }
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password; 
    if (role !== undefined) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only an admin can change roles" });
      }
      user.role = role;
    }

    await user.save();
    res.json({ user: userResponse(user) });
  } catch (err) {
    handleError(err, res);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (!isSelfOrAdmin(req, id)) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    handleError(err, res);
  }
};