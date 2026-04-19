const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
// 1. Make the uploads folder public so the frontend can see the images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Set up where and how to save the images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save in the new folder we created
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Give it a unique timestamp name
    }
});
const upload = multer({ storage: storage });

// 3. The new route to catch the incoming photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ imageUrl: `https://sol-backend-7j1v.onrender.com/uploads/${req.file.filename}` });
});
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL! 🚀");
});

// --- REGISTER ROUTE ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Scramble the password
        const sql = 'INSERT INTO app_users (username, password) VALUES (?, ?)';
        
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json(err);
            }
            // Create a blank settings row for the new user's heatmap
            db.query('INSERT INTO user_settings (user_id, history_json) VALUES (?, ?)', [result.insertId, '{}']);
            res.json({ message: 'User created!', userId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM app_users WHERE username = ?';
    
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(400).json({ error: 'User not found' });
        
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password); // Compare typed password to scrambled password
        
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });
        
        res.json({ message: 'Login successful', userId: user.id, username: user.username });
    });
});

app.get('/api/activities', (req, res) => {
    const sql = 'SELECT * FROM activities WHERE user_id = ? ORDER BY scheduled_time ASC';
    db.query(sql, [req.query.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/activities', (req, res) => {
    const { user_id, title, scheduled_time, activity_date } = req.body;
    const sql = 'INSERT INTO activities (user_id, title, scheduled_time, activity_date) VALUES (?, ?, ?, ?)';
    db.query(sql, [user_id, title, scheduled_time, activity_date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.put('/api/activities/:id', (req, res) => {
    const { is_ticked } = req.body;
    const sql = 'UPDATE activities SET is_ticked = ? WHERE id = ?';
    db.query(sql, [is_ticked, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Updated' });
    });
});

// --- DELETE, GET & POST JOURNAL ENTRY ---

app.get('/api/journal', (req, res) => {
    db.query('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC', [req.query.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/journal', (req, res) => {
    const { user_id, date, time, moodObj, activities, note, image } = req.body;
    const sql = 'INSERT INTO journal_entries (user_id, entry_date, entry_time, mood, mood_emoji, mood_color, activities, note, image_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const actStr = JSON.stringify(activities);
    
    db.query(sql, [user_id || 1, date, time, moodObj.mood, moodObj.emoji, moodObj.color, actStr, note, image], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.delete('/api/journal/:id', (req, res) => {
    db.query('DELETE FROM journal_entries WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Journal deleted' });
    });
});

// --- NOTES ROUTES ---
app.get('/api/notes', (req, res) => {
    db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC', [req.query.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/notes', (req, res) => {
    const { user_id, title, priority, deadline } = req.body;
    const sql = 'INSERT INTO notes (user_id, title, priority, deadline) VALUES (?, ?, ?, ?)';
    db.query(sql, [user_id, title, priority, deadline || null], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.delete('/api/notes/:id', (req, res) => {
    db.query('DELETE FROM notes WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Note deleted' });
    });
});

app.get('/api/history', (req, res) => {
    db.query('SELECT history_json FROM user_settings WHERE user_id = ?', [req.query.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0 && results[0].history_json) {
            // Check if mysql2 already parsed it into an object for us
            const historyData = typeof results[0].history_json === 'string' 
                ? JSON.parse(results[0].history_json) 
                : results[0].history_json;
                
            res.json(historyData);
        } else {
            res.json({});
        }
    });
});

app.post('/api/history', (req, res) => {
    const historyData = JSON.stringify(req.body);
    const sql = 'UPDATE user_settings SET history_json = ? WHERE user_id = 1';
    db.query(sql, [historyData], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'History saved' });
    });
});

// This defines the port: Use the one Render gives us, or 5000 if we are on our own PC
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});