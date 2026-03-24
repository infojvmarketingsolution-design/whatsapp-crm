const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');

const getFlows = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    
    const flows = await Flow.find().sort({ createdAt: -1 }).select('-nodes -edges');
    res.json(flows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFlowById = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    
    const flow = await Flow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });
    res.json(flow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFlow = async (req, res) => {
  try {
    const { name, description, triggerType, triggerKeywords } = req.body;
    const tenantDb = getTenantConnection(req.tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    
    const newFlow = await Flow.create({
      name,
      description,
      triggerType: triggerType || 'KEYWORD',
      triggerKeywords: triggerKeywords || [],
      nodes: [
        { id: 'start-1', type: 'triggerNode', position: { x: 250, y: 100 }, data: { label: 'Start Flow' } }
      ],
      edges: []
    });

    res.status(201).json(newFlow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFlow = async (req, res) => {
  try {
    const { name, description, status, triggerType, triggerKeywords, nodes, edges } = req.body;
    const tenantDb = getTenantConnection(req.tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    
    const flow = await Flow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    if (name) flow.name = name;
    if (description !== undefined) flow.description = description;
    if (status) flow.status = status;
    if (triggerType) flow.triggerType = triggerType;
    if (triggerKeywords) flow.triggerKeywords = triggerKeywords;
    if (nodes) flow.nodes = nodes;
    if (edges) flow.edges = edges;

    await flow.save();
    res.json(flow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFlow = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    
    await Flow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flow deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFlows,
  getFlowById,
  createFlow,
  updateFlow,
  deleteFlow
};
