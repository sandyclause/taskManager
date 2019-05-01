const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0

router.get('/tasks', auth, async (req, res) => {
  const match = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  try {
    // const tasks = await Task.find({owner: req.user._id});
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
      }
    }).execPopulate()
    // res.send(tasks);
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send();
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({_id, owner: req.user._id});

    if (!task) {
      return res.status(404).send();
    }
     res.send(task);
  } catch (e) {
    res.status(500).send();
  }
})

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {

  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    res.status(400).send({error: 'invalid updates'})
  }

  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
    
    if (!task) {
      res.status(404).send()
    }
    
    updates.forEach(update => {
      task[update] = req.body[update]
    });
    await task.save();
    res.send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});

    if (!task) {
      res.send(404).send()
    }

    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router;