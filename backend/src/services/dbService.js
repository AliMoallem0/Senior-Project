const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db = null;

async function initializeDatabase() {
  if (!db) {
    db = await open({
      filename: 'urban-sim.db',
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'admin')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId TEXT NOT NULL,
        userId TEXT NOT NULL,
        cityName TEXT NOT NULL,
        parameters TEXT NOT NULL,
        results TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
}

async function createUser(userData) {
  const db = await initializeDatabase();
  const result = await db.run(
    `INSERT INTO users (email, password, name, role)
     VALUES (?, ?, ?, ?)`,
    [userData.email, userData.password, userData.name, userData.role]
  );

  return {
    id: result.lastID,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function findUserByEmail(email) {
  const db = await initializeDatabase();
  return await db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function updateUserLastLogin(userId) {
  const db = await initializeDatabase();
  await db.run(
    'UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [userId]
  );
}

async function saveSimulationResult(result) {
  const db = await initializeDatabase();
  const { lastID } = await db.run(
    `INSERT INTO simulations (projectId, userId, cityName, parameters, results)
     VALUES (?, ?, ?, ?, ?)`,
    [
      result.projectId,
      result.userId,
      result.cityName,
      JSON.stringify(result.parameters),
      JSON.stringify(result.results)
    ]
  );

  return lastID;
}

async function getSimulationResults(projectId) {
  const db = await initializeDatabase();
  const results = await db.all('SELECT * FROM simulations WHERE projectId = ?', [projectId]);
  
  return results.map(result => ({
    ...result,
    parameters: JSON.parse(result.parameters),
    results: JSON.parse(result.results)
  }));
}

async function closeConnection() {
  if (db) {
    await db.close();
    db = null;
  }
}

module.exports = {
  initializeDatabase,
  createUser,
  findUserByEmail,
  updateUserLastLogin,
  saveSimulationResult,
  getSimulationResults,
  closeConnection
}; 