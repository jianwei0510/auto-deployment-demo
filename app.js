const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

// 中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 初始化數據庫
const db = new Database('./data/clinic.db');

// 創建表
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    complaint TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    is_examined INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API 路由

// 獲取今日看診清單
app.get('/api/patients/today', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, complaint, appointment_time, is_examined
      FROM patients
      WHERE DATE(created_at) = DATE('now')
      ORDER BY appointment_time ASC
    `);
    const patients = stmt.all();
    res.json(patients);
  } catch (error) {
    console.error('獲取患者列表錯誤:', error);
    res.status(500).json({ error: '獲取患者列表失敗' });
  }
});

// 新增患者
app.post('/api/patients', (req, res) => {
  try {
    const { name, complaint, appointment_time } = req.body;
    
    if (!name || !complaint || !appointment_time) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO patients (name, complaint, appointment_time)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(name, complaint, appointment_time);
    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: '患者已新增'
    });
  } catch (error) {
    console.error('新增患者錯誤:', error);
    res.status(500).json({ error: '新增患者失敗' });
  }
});

// 標記已看診
app.patch('/api/patients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { is_examined } = req.body;
    
    const stmt = db.prepare(`
      UPDATE patients
      SET is_examined = ?
      WHERE id = ?
    `);
    
    stmt.run(is_examined ? 1 : 0, id);
    res.json({ success: true, message: '狀態已更新' });
  } catch (error) {
    console.error('更新患者狀態錯誤:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 主頁面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`病患看診系統已啟動: http://localhost:${PORT}`);
});
