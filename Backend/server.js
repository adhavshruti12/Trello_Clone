const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();
const { verifyToken } = require('./middleware/auth');
const Board = require('./models/Board'); // Assuming you have a Board model
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight requests for all routes
const corsOptions = {
  origin: "https://trello-clone-l5lo.vercel.app", // Your frontend URL
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization,Username, Password", // Add "Password" header explicitly
  credentials: true,
};
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
  }, { collection: 'Trello_User' });
  
  const User = mongoose.model('Trello_User', userSchema);
  

// Register Route
app.post('/api/signup', async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const user = new User({ email });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Generate token
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/boards
router.post('/', verifyToken, async (req, res) => {
    const { boardName } = req.body;
    const userId = req.user.id;
  
    if (!boardName) {
      return res.status(400).json({ message: 'Board name is required' });
    }
  
    try {
      const newBoard = new Board({ name: boardName, userId });
      await newBoard.save();
      res.status(201).json({ message: 'Board created successfully', board: newBoard });
    } catch (error) {
      console.error('Error creating board:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

app.use('/api/boards', router);

// GET /api/boards
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const boards = await Board.find({ userId });
    res.status(200).json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = router;




