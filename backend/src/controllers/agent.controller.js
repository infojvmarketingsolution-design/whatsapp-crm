const User = require('../models/core/User');
const mongoose = require('mongoose');

const getAgents = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const agents = await User.find({ tenantId, role: { $ne: 'SUPER_ADMIN' } }).select('-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAgent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, email, password, role, phoneNumber, mpin } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newAgent = await User.create({
      name,
      email,
      password,
      role: role || 'AGENT',
      tenantId,
      status: 'ACTIVE',
      phoneNumber,
      mpin
    });

    res.status(201).json({
      _id: newAgent._id,
      name: newAgent.name,
      email: newAgent.email,
      role: newAgent.role,
      status: newAgent.status,
      tenantId: newAgent.tenantId,
      phoneNumber: newAgent.phoneNumber,
      mpin: newAgent.mpin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAgentStatus = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status } = req.body;
    const agent = await User.findOne({ _id: req.params.id, tenantId, role: { $ne: 'SUPER_ADMIN' } }).select('-password');
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    agent.status = status || agent.status;
    const updatedAgent = await agent.save();

    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAgent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, email, password, role, phoneNumber, mpin } = req.body;
    const agent = await User.findOne({ _id: req.params.id, tenantId, role: { $ne: 'SUPER_ADMIN' } });
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    if (name) agent.name = name;
    if (email) agent.email = email;
    if (role) agent.role = role;
    if (password) agent.password = password;
    if (phoneNumber !== undefined) agent.phoneNumber = phoneNumber;
    if (mpin !== undefined) agent.mpin = mpin;

    const updatedAgent = await agent.save();

    res.json({
      _id: updatedAgent._id,
      name: updatedAgent.name,
      email: updatedAgent.email,
      role: updatedAgent.role,
      status: updatedAgent.status,
      tenantId: updatedAgent.tenantId,
      phoneNumber: updatedAgent.phoneNumber,
      mpin: updatedAgent.mpin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const agent = await User.findOne({ _id: req.params.id, tenantId, role: { $ne: 'SUPER_ADMIN' } });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    await User.deleteOne({ _id: req.params.id });

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAgents, createAgent, updateAgent, updateAgentStatus, deleteAgent };
