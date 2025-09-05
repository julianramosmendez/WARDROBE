const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const User = require('./models/User');
const ClothingItem = require('./models/ClothingItem');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Helper function to convert HEIC to JPEG
async function convertHeicToJpeg(inputPath, outputPath) {
  try {
    const fs = require('fs');
    const inputBuffer = fs.readFileSync(inputPath);
    
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    fs.writeFileSync(outputPath, outputBuffer);
    return true;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return false;
  }
}

// MongoDB connection
mongoose.connect('mongodb+srv://julianramosmendez:iYEd5BQazQwE91SX@cluster0.0k4vpyh.mongodb.net/wardrobe?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Session and Passport setup
app.use(session({
  secret: 'wardrobe_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: 'GOOGLE_CLIENT_ID', // TODO: Replace with your Google client ID
  clientSecret: 'GOOGLE_CLIENT_SECRET', // TODO: Replace with your Google client secret
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({ googleId: profile.id });
  }
  return done(null, user);
}));

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Registration attempt:', { username, password: password ? '***' : 'missing' });
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('Username already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    console.log('User created successfully:', user.username);
    
    res.json({ message: 'User registered', user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, 'wardrobe_jwt_secret', { expiresIn: '1d' });
  res.json({ message: 'Login successful', token });
});

// ,oooGoogle OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  // Successful authentication, redirect to frontend with token
  // You may want to generate a JWT here and send it to the frontend
  res.redirect('/');
});

// JWT middleware to verify tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, 'wardrobe_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('Upload received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    });
    
    let finalFilename = req.file.filename;
    let imageUrl = `http://localhost:5003/uploads/${finalFilename}`;
    const fs = require('fs');
    
    // Convert HEIC to JPEG if needed
    if (req.file.mimetype === 'image/heic' || req.file.originalname.toLowerCase().endsWith('.heic')) {
      console.log('Converting HEIC to JPEG...');
      
      const jpegFilename = req.file.filename.replace(/\.[^/.]+$/, '.jpg');
      const inputPath = path.join(__dirname, 'uploads', req.file.filename);
      const outputPath = path.join(__dirname, 'uploads', jpegFilename);
      
      console.log('Converting:', inputPath, 'to:', outputPath);
      
      // Use the dedicated HEIC converter
      const conversionSuccess = await convertHeicToJpeg(inputPath, outputPath);
      
      if (conversionSuccess) {
        // Delete the original HEIC file
        fs.unlinkSync(inputPath);
        
        finalFilename = jpegFilename;
        imageUrl = `http://localhost:5003/uploads/${jpegFilename}`;
        console.log('HEIC conversion complete. New filename:', finalFilename);
      } else {
        // If conversion fails, try using Sharp as fallback
        try {
          await sharp(inputPath)
            .jpeg({ quality: 90 })
            .toFile(outputPath);
          
          // Delete the original HEIC file
          fs.unlinkSync(inputPath);
          
          finalFilename = jpegFilename;
          imageUrl = `http://localhost:5003/uploads/${jpegFilename}`;
          console.log('HEIC conversion complete using Sharp fallback. New filename:', finalFilename);
        } catch (sharpError) {
          console.error('Both HEIC conversion methods failed:', sharpError);
          // Keep the original file but warn the user
          res.json({
            message: 'File uploaded successfully, but HEIC conversion failed. Image may not display in all browsers.',
            file: { ...req.file, filename: finalFilename },
            imageUrl: imageUrl,
            userId: req.user.id,
            warning: 'HEIC files may not display properly in web browsers. Consider converting to JPEG before uploading.'
          });
          return;
        }
      }
    } else {
      console.log('No conversion needed, using original file');
    }
    
    console.log('Final image URL:', imageUrl);
    
    res.json({
      message: 'File uploaded successfully',
      file: { ...req.file, filename: finalFilename },
      imageUrl: imageUrl,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file: ' + error.message });
  }
});

// Get all clothing items for the logged-in user
app.get('/api/wardrobe', authenticateToken, async (req, res) => {
  try {
    const items = await ClothingItem.find({ userId: req.user.id });
    res.json({ 
      message: 'Get all clothing items for user',
      userId: req.user.id,
      items: items
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching items' });
  }
});

// Get individual clothing item by ID
app.get('/api/wardrobe/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await ClothingItem.findOne({ _id: itemId, userId: req.user.id });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ 
      message: 'Get clothing item',
      item: item
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching item' });
  }
});

// Add new clothing item for the logged-in user
app.post('/api/wardrobe', authenticateToken, async (req, res) => {
  try {
    const { name, category, description, imageUrl } = req.body;
    const newItem = await ClothingItem.create({
      userId: req.user.id,
      name,
      category,
      description,
      imageUrl
    });
    res.json({ 
      message: 'Item added successfully',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Error adding item' });
  }
});

// Delete clothing item for the logged-in user
app.delete('/api/wardrobe/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Find the item to get the image URL before deleting
    const item = await ClothingItem.findOne({ _id: itemId, userId: req.user.id });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Delete the item from database
    await ClothingItem.findByIdAndDelete(itemId);
    
    // Delete the physical file from uploads folder
    if (item.imageUrl) {
      const fs = require('fs');
      const path = require('path');
      
      // Extract filename from the imageUrl
      let filename = item.imageUrl;
      if (filename.includes('/uploads/')) {
        filename = filename.split('/uploads/')[1];
      }
      
      const filePath = path.join(__dirname, 'uploads', filename);
      
      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted file:', filePath);
      } else {
        console.log('File not found:', filePath);
      }
    }
    
    res.json({ 
      message: 'Item deleted successfully',
      deletedItem: item
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

// Convert existing HEIC files to JPEG (utility route)
app.post('/api/convert-heic', authenticateToken, async (req, res) => {
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    
    let convertedCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      if (file.toLowerCase().endsWith('.heic')) {
        const inputPath = path.join(uploadsDir, file);
        const jpegFilename = file.replace(/\.heic$/i, '.jpg');
        const outputPath = path.join(uploadsDir, jpegFilename);
        
        console.log(`Converting ${file} to ${jpegFilename}...`);
        
        const success = await convertHeicToJpeg(inputPath, outputPath);
        if (success) {
          fs.unlinkSync(inputPath); // Delete original HEIC
          convertedCount++;
          console.log(`Successfully converted ${file}`);
        } else {
          errorCount++;
          console.log(`Failed to convert ${file}`);
        }
      }
    }
    
    res.json({
      message: 'HEIC conversion complete',
      converted: convertedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('HEIC conversion error:', error);
    res.status(500).json({ error: 'Error converting HEIC files' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 