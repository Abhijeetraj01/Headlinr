// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


require('dotenv').config({ path: './server/.env' });



const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(bodyParser.json());


app.get('/config', (req, res) => {
  res.json({ apiKey: process.env.NEWS_API_KEY });
});


//Serve static files from ROOT 
app.use(express.static(path.join(__dirname, '..')));

//MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});


db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// API to save contact form
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error inserting into database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('New contact saved:', { id: result.insertId, name, email });
    res.status(200).json({ message: 'Message saved successfully!' });
  });
});

// Serve MAIN index.html when user visits 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'contact', 'contact.html'));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
