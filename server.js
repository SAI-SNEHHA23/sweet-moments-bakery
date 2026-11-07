require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sneha_petcare",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
};
const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
  // Create the database first, then the three project tables.
  const connection = await mysql.createConnection({
    host: dbConfig.host, user: dbConfig.user,
    password: dbConfig.password, port: dbConfig.port
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await connection.end();
  const statements = [
    `CREATE TABLE IF NOT EXISTS owners (
      owner_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL, email VARCHAR(100),
      phone VARCHAR(15) NOT NULL, address VARCHAR(200))`,
    `CREATE TABLE IF NOT EXISTS pets (
      pet_id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL, pet_name VARCHAR(100) NOT NULL,
      species VARCHAR(50) NOT NULL, breed VARCHAR(50), age INT,
      CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id)
      REFERENCES owners(owner_id) ON UPDATE CASCADE ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS appointments (
      appointment_id INT AUTO_INCREMENT PRIMARY KEY,
      pet_id INT NOT NULL, doctor_name VARCHAR(100) NOT NULL,
      appointment_date DATE NOT NULL, reason VARCHAR(200),
      status VARCHAR(30) DEFAULT 'Pending',
      CONSTRAINT fk_appointments_pet FOREIGN KEY (pet_id)
      REFERENCES pets(pet_id) ON UPDATE CASCADE ON DELETE CASCADE)`
  ];
  for (const sql of statements) await pool.query(sql);
}
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);

app.get("/api/health", asyncRoute(async (req,res) => {
  await pool.query("SELECT 1");
  res.json({ok:true, message:"Sneha PetCare Center is connected to MySQL."});
}));

const resources = {
  owners: {
    table:"owners", id:"owner_id",
    fields:["name","email","phone","address"],
    required:["name","phone"]
  },
  pets: {
    table:"pets", id:"pet_id",
    fields:["owner_id","pet_name","species","breed","age"],
    required:["owner_id","pet_name","species"]
  },
  appointments: {
    table:"appointments", id:"appointment_id",
    fields:["pet_id","doctor_name","appointment_date","reason","status"],
    required:["pet_id","doctor_name","appointment_date"]
  }
};
for (const [key, cfg] of Object.entries(resources)) {
  app.get(`/api/${key}`, asyncRoute(async (req,res) => {
    let sql;
    if (key === "pets") sql = `SELECT p.*, o.name AS owner_name FROM pets p JOIN owners o ON p.owner_id=o.owner_id ORDER BY p.pet_id DESC`;
    else if (key === "appointments") sql = `SELECT a.*, p.pet_name, o.name AS owner_name FROM appointments a JOIN pets p ON a.pet_id=p.pet_id JOIN owners o ON p.owner_id=o.owner_id ORDER BY a.appointment_date DESC, a.appointment_id DESC`;
    else sql = `SELECT * FROM owners ORDER BY owner_id DESC`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  }));
  app.post(`/api/${key}`, asyncRoute(async (req,res) => {
    for (const field of cfg.required) {
      if (req.body[field] === undefined || req.body[field] === "") return res.status(400).json({error:`${field} is required`});
    }
    const fields = cfg.fields.filter(f => req.body[f] !== undefined);
    const values = fields.map(f => req.body[f] === "" ? null : req.body[f]);
    const [result] = await pool.query(
      `INSERT INTO ${cfg.table} (${fields.join(",")}) VALUES (${fields.map(()=>"?").join(",")})`, values
    );
    res.status(201).json({message:"Record added successfully", id:result.insertId});
  }));
  app.put(`/api/${key}/:id`, asyncRoute(async (req,res) => {
    const fields = cfg.fields.filter(f => req.body[f] !== undefined);
    if (!fields.length) return res.status(400).json({error:"No fields supplied"});
    const values = fields.map(f => req.body[f] === "" ? null : req.body[f]);
    const [result] = await pool.query(
      `UPDATE ${cfg.table} SET ${fields.map(f=>`${f}=?`).join(",")} WHERE ${cfg.id}=?`,
      [...values, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({error:"Record not found"});
    res.json({message:"Record updated successfully"});
  }));
  app.delete(`/api/${key}/:id`, asyncRoute(async (req,res) => {
    const [result] = await pool.query(`DELETE FROM ${cfg.table} WHERE ${cfg.id}=?`, [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({error:"Record not found"});
    res.json({message:"Record deleted successfully"});
  }));
}

app.get("*", (req,res) => res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,req,res,next) => {
  console.error(err);
  res.status(500).json({error: err.code === "ER_ACCESS_DENIED_ERROR"
    ? "MySQL login failed. Check DB_USER and DB_PASSWORD in your .env file."
    : err.code === "ECONNREFUSED"
    ? "Cannot reach MySQL. Make sure MySQL Server is running."
    : err.message || "Server error"});
});

const port = Number(process.env.PORT || 3000);
initializeDatabase().then(() => {
  app.listen(port, () => console.log(`Sneha PetCare Center running at http://localhost:${port}`));
}).catch(err => {
  console.error("Database setup failed:", err.message);
  console.error("Check MySQL is running and your .env credentials are correct.");
  process.exit(1);
});
