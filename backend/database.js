const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'database.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initDatabase();
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDatabase() {
  try {
    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    // Create members table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // Create services table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        suministro TEXT DEFAULT '',
        titular TEXT DEFAULT ''
      )
    `);

    // Create expenses table (monthly records)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        UNIQUE(year, month)
      )
    `);

    // Create expense items table (bill details for a service in a month)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS expense_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        amount REAL DEFAULT 0,
        due_date TEXT DEFAULT '',
        FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE,
        UNIQUE(expense_id, service_id)
      )
    `);

    // Create service participants table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS service_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(service_id, member_id)
      )
    `);

    // Seed data if members table is empty
    const membersCount = await getQuery('SELECT COUNT(*) as count FROM members');
    if (membersCount.count === 0) {
      console.log('Seeding initial dynamic data...');
      
      // 1. Seed members
      await runQuery("INSERT INTO members (name) VALUES ('Rafo')");
      await runQuery("INSERT INTO members (name) VALUES ('Mamá')");
      await runQuery("INSERT INTO members (name) VALUES ('Arnold')");

      const members = await allQuery('SELECT * FROM members');
      const rafo = members.find(m => m.name === 'Rafo');
      const mama = members.find(m => m.name === 'Mamá');
      const arnold = members.find(m => m.name === 'Arnold');

      // 2. Seed services (with supply numbers and holder)
      await runQuery("INSERT INTO services (name, suministro, titular) VALUES ('Luz', '1624103', 'Mamá')");
      await runQuery("INSERT INTO services (name, suministro, titular) VALUES ('Agua', '6324603', 'Mamá')");
      await runQuery("INSERT INTO services (name, suministro, titular) VALUES ('Gas', '1595930', 'Mamá')");

      const services = await allQuery('SELECT * FROM services');
      const luz = services.find(s => s.name === 'Luz');
      const agua = services.find(s => s.name === 'Agua');
      const gas = services.find(s => s.name === 'Gas');

      // 3. Seed rules
      // Luz: Rafo, Mamá, Arnold
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [luz.id, rafo.id]);
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [luz.id, mama.id]);
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [luz.id, arnold.id]);

      // Agua: Rafo, Mamá, Arnold
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [agua.id, rafo.id]);
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [agua.id, mama.id]);
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [agua.id, arnold.id]);

      // Gas: Mamá, Arnold
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [gas.id, mama.id]);
      await runQuery("INSERT INTO service_participants (service_id, member_id) VALUES (?, ?)", [gas.id, arnold.id]);

      // 4. Seed historical expenses 2026
      const historicalData = [
        { year: 2026, month: 1, luz: 122.00, agua: 41.00, gas: 33.40 },
        { year: 2026, month: 2, luz: 104.50, agua: 49.90, gas: 28.50 },
        { year: 2026, month: 3, luz: 154.00, agua: 54.40, gas: 35.10 },
        { year: 2026, month: 4, luz: 112.50, agua: 49.80, gas: 34.80 },
        { year: 2026, month: 5, luz: 83.50, agua: 40.90, gas: 34.50 },
        { year: 2026, month: 6, luz: 67.00, agua: 45.40, gas: 28.30 }
      ];

      for (const exp of historicalData) {
        // Insert expense month
        const expResult = await runQuery(
          "INSERT INTO expenses (year, month) VALUES (?, ?)",
          [exp.year, exp.month]
        );
        const expId = expResult.id;

        // Insert items (mocking some due dates for June, leaving others generic or empty)
        const generateDueDate = (day) => {
          return `${exp.year}-${exp.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        };

        await runQuery(
          "INSERT INTO expense_items (expense_id, service_id, amount, due_date) VALUES (?, ?, ?, ?)",
          [expId, luz.id, exp.luz, generateDueDate(25)]
        );
        await runQuery(
          "INSERT INTO expense_items (expense_id, service_id, amount, due_date) VALUES (?, ?, ?, ?)",
          [expId, agua.id, exp.agua, generateDueDate(28)]
        );
        await runQuery(
          "INSERT INTO expense_items (expense_id, service_id, amount, due_date) VALUES (?, ?, ?, ?)",
          [expId, gas.id, exp.gas, generateDueDate(20)]
        );
      }
      
      console.log('Dynamic Database seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Database Operations
module.exports = {
  // Members
  getMembers: () => allQuery('SELECT * FROM members ORDER BY name'),
  saveMember: async (id, name) => {
    if (id) {
      return runQuery('UPDATE members SET name = ? WHERE id = ?', [name, id]);
    } else {
      return runQuery('INSERT INTO members (name) VALUES (?)', [name]);
    }
  },
  deleteMember: (id) => runQuery('DELETE FROM members WHERE id = ?', [id]),

  // Services
  getServices: () => allQuery('SELECT * FROM services ORDER BY name'),
  saveService: async (id, name, suministro, titular) => {
    if (id) {
      return runQuery(
        'UPDATE services SET name = ?, suministro = ?, titular = ? WHERE id = ?',
        [name, suministro, titular, id]
      );
    } else {
      const result = await runQuery(
        'INSERT INTO services (name, suministro, titular) VALUES (?, ?, ?)',
        [name, suministro, titular]
      );
      // Auto-assign all active members to a new service by default
      const members = await allQuery('SELECT id FROM members');
      for (const m of members) {
        await runQuery(
          'INSERT OR IGNORE INTO service_participants (service_id, member_id) VALUES (?, ?)',
          [result.id, m.id]
        );
      }
      return result;
    }
  },
  deleteService: (id) => runQuery('DELETE FROM services WHERE id = ?', [id]),

  // Expenses
  getExpenses: async () => {
    const months = await allQuery('SELECT * FROM expenses ORDER BY year DESC, month DESC');
    const items = await allQuery(`
      SELECT ei.*, s.name as service_name 
      FROM expense_items ei
      JOIN services s ON ei.service_id = s.id
    `);

    // Group items by expense_id
    const itemsByExpense = {};
    items.forEach(item => {
      if (!itemsByExpense[item.expense_id]) {
        itemsByExpense[item.expense_id] = [];
      }
      itemsByExpense[item.expense_id].push(item);
    });

    // Merge items into months
    return months.map(m => ({
      ...m,
      items: itemsByExpense[m.id] || []
    }));
  },
  saveExpense: async (year, month, items) => {
    // items: array of { service_id, amount, due_date }
    let expense = await getQuery('SELECT id FROM expenses WHERE year = ? AND month = ?', [year, month]);
    let expenseId;

    if (expense) {
      expenseId = expense.id;
    } else {
      const result = await runQuery('INSERT INTO expenses (year, month) VALUES (?, ?)', [year, month]);
      expenseId = result.id;
    }

    // Insert or update each item
    for (const item of items) {
      const existingItem = await getQuery(
        'SELECT id FROM expense_items WHERE expense_id = ? AND service_id = ?',
        [expenseId, item.service_id]
      );
      
      const parseNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      if (existingItem) {
        await runQuery(
          'UPDATE expense_items SET amount = ?, due_date = ? WHERE id = ?',
          [parseNum(item.amount), item.due_date || '', existingItem.id]
        );
      } else {
        await runQuery(
          'INSERT INTO expense_items (expense_id, service_id, amount, due_date) VALUES (?, ?, ?, ?)',
          [expenseId, item.service_id, parseNum(item.amount), item.due_date || '']
        );
      }
    }
    return { expenseId };
  },
  deleteExpense: (id) => runQuery('DELETE FROM expenses WHERE id = ?', [id]),

  // Rules / Participants
  getRules: () => allQuery('SELECT * FROM service_participants'),
  updateRules: async (serviceRules) => {
    // serviceRules: array of { service_id, member_ids: [] }
    await runQuery('DELETE FROM service_participants');
    for (const rule of serviceRules) {
      for (const memberId of rule.member_ids) {
        await runQuery(
          'INSERT OR IGNORE INTO service_participants (service_id, member_id) VALUES (?, ?)',
          [rule.service_id, memberId]
        );
      }
    }
    return { success: true };
  }
};
