// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer setup to preserve original filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));

// Get list of files with sizes
app.get('/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      console.error('Error reading upload directory:', err);
      return res.status(500).json({ error: 'Cannot list files' });
    }

    const fileDetails = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Only include actual files, not directories
        if (stats.isFile()) {
          fileDetails.push({ 
            name: file, 
            size: stats.size 
          });
        }
      } catch (statErr) {
        console.error(`Error getting stats for file ${file}:`, statErr);
        // Skip this file but continue with others
        continue;
      }
    }

    console.log('Sending file details:', fileDetails);
    res.json(fileDetails);
  });
});

// Upload a single file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('File uploaded:', req.file.originalname);
  res.json({ 
    success: true,
    filename: req.file.originalname,
    size: req.file.size 
  });
});

// Delete file
app.delete('/files/:filename', (req, res) => {
  const safeName = path.basename(decodeURIComponent(req.params.filename));
  const filePath = path.join(UPLOAD_DIR, safeName);
  
  console.log('Attempting to delete:', filePath);
  
  fs.unlink(filePath, err => {
    if (err) {
      console.error('Delete failed:', err);
      return res.status(500).json({ error: 'Delete failed' });
    }
    console.log('File deleted successfully:', safeName);
    res.json({ success: true });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📦 Server running at http://localhost:${PORT}`);
});