const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Endpoints for Services (CRUD)
app.get('/api/services', async (req, res) => {
  try {
    const services = await db.getServices();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { id, name, suministro, titular } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.saveService(id, name.trim(), (suministro || '').trim(), (titular || '').trim());
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error saving service:', error);
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Service name already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteService(id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoints for Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.getExpenses();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { year, month, items } = req.body;
    
    if (year === undefined || month === undefined) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    await db.saveExpense(parseInt(year), parseInt(month), items);
    res.json({ success: true, message: 'Expenses saved successfully' });
  } catch (error) {
    console.error('Error saving expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteExpense(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoints for Members
app.get('/api/members', async (req, res) => {
  try {
    const members = await db.getMembers();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await db.saveMember(id, name.trim());
    res.json({ success: true, id: id || result.id });
  } catch (error) {
    console.error('Error saving member:', error);
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Member name already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteMember(id);
    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoints for Service Rules
app.get('/api/rules', async (req, res) => {
  try {
    const rules = await db.getRules();
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/rules', async (req, res) => {
  try {
    const { rules } = req.body;
    // Expect rules to be an array of { service_id: number, member_ids: number[] }
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Rules must be an array' });
    }
    
    await db.updateRules(rules);
    res.json({ success: true, message: 'Rules updated successfully' });
  } catch (error) {
    console.error('Error updating rules:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
