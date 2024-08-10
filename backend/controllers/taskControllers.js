const Task = require("../models/Task");
const { validateObjectId } = require("../utils/validation");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).json({ tasks, status: true, msg: "Tasks found successfully.." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

exports.getTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    const task = await Task.findOne({ user: req.user.id, _id: req.params.taskId });
    if (!task) {
      return res.status(404).json({ status: false, msg: "No task found.." });
    }
    res.status(200).json({ task, status: true, msg: "Task found successfully.." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

exports.postTask = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    // Check for duplicate description
    const existingTask = await Task.findOne({ user: req.user.id, description });
    if (existingTask) {
      return res.status(400).json({ status: false, msg: "Task with this description already exists" });
    }

    const task = await Task.create({ user: req.user.id, description });
    res.status(201).json({ task, status: true, msg: "Task created successfully.." });
  } catch (err) {
    console.error(err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ status: false, msg: "Duplicate task description" });
    }

    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

exports.putTask = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ status: false, msg: "You can't update task of another user" });
    }

    // Check if the new description already exists for another task of this user
    const existingTask = await Task.findOne({ user: req.user.id, description });
    if (existingTask && existingTask._id.toString() !== req.params.taskId) {
      return res.status(400).json({ status: false, msg: "Task with this description already exists" });
    }

    task = await Task.findByIdAndUpdate(req.params.taskId, { description }, { new: true });
    res.status(200).json({ task, status: true, msg: "Task updated successfully.." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ status: false, msg: "You can't delete task of another user" });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ status: true, msg: "Task deleted successfully.." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};
