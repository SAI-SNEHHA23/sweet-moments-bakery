# Sneha PetCare Center — Pet Care / Veterinary Management System

A responsive pet-care website with a MySQL-backed management system. It uses exactly three main tables: `owners`, `pets`, and `appointments`.

## Requirements
- Node.js (LTS) and npm
- MySQL Server (MySQL Workbench is optional but useful)
- VS Code or another editor

## 1. Configure MySQL password
1. Open this project folder in VS Code.
2. Make a copy of `.env.example` and rename the copy to `.env`.
3. Open `.env` and replace `YOUR_MYSQL_PASSWORD` with your MySQL root password.
4. If your MySQL username is not `root`, change `DB_USER`.
5. Keep `.env` private. It is excluded by `.gitignore`.

Example:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=sneha_petcare
DB_PORT=3306
PORT=3000
```
Do not put the password in HTML, CSS, browser JavaScript, screenshots, or GitHub.

## 2. Start MySQL
Start your MySQL Server service. Workbench is a database client; the actual MySQL Server must be running.

## 3. Install and run
Open a terminal in the folder containing `package.json`, then run:
```bash
npm install
npm start
```
Open **http://localhost:3000** in your browser.

The server automatically creates the `sneha_petcare` database and the three tables when it starts. You can also run `database/schema.sql` manually in MySQL Workbench if you prefer.

## 4. Use the website
- Home page: services, about, generated pet-care photo gallery and appointment request form.
- Management section: add/edit/delete owners, pets and appointments.
- Appointment status can be changed between Pending, Confirmed, Completed and Cancelled.
- A booking submitted from the homepage creates/updates an owner, creates their pet, and creates a pending appointment in MySQL.

## Database relationships
- One owner can have many pets (`pets.owner_id` → `owners.owner_id`).
- One pet can have many appointments (`appointments.pet_id` → `pets.pet_id`).
- Deleting an owner cascades to their pets and appointments; deleting a pet cascades to its appointments.

## Troubleshooting
- **Access denied**: recheck `DB_USER` and `DB_PASSWORD` in `.env`.
- **ECONNREFUSED**: start MySQL Server and check `DB_PORT`.
- **Unknown database**: normally created automatically; confirm the MySQL account has permission to create databases.
- **Port 3000 already in use**: stop the other running server, or change `PORT=3001` in `.env` and open `http://localhost:3001`.
- If you change `.env`, stop the server with `Ctrl+C` and run `npm start` again.

## Project structure
```text
sneha-petcare-center/
├── database/schema.sql
├── public/
│   ├── css/style.css
│   ├── images/          # Generated pet-care photographs
│   ├── js/app.js
│   └── index.html
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

This is a mini-project starter, not a substitute for a production clinic system. Before public deployment, add authentication and role-based access, HTTPS, backups, validation, and privacy protections. The current management area is intentionally open for local demonstration.
