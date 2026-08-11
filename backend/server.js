const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RedNote API',
      version: '1.0.0',
      description: 'RedNote Social Media API - Notes, Users, Chats, Notifications, and more',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'RedNote API Docs' }));

const notesData = require('./data/notes');
const usersData = require('./data/users');

let notes = [...notesData];
let users = [...usersData];
let notifications = [
  { id: '1', type: 'like', userId: 'u2', noteId: '1', text: 'Sofia Reed and 214 others liked your note', time: '12m ago', read: false },
  { id: '2', type: 'follow', userId: 'u3', noteId: null, text: 'Leo Park started following you', time: '1h ago', read: false },
  { id: '3', type: 'comment', userId: 'u5', noteId: '1', text: 'Nina Tanaka commented: "This is so helpful, thank you!!"', time: '3h ago', read: false },
  { id: '4', type: 'star', userId: 'u4', noteId: '10', text: 'Zoe Lin collected your note', time: '1d ago', read: true },
];
let chats = [
  { id: 'c1', participants: ['me', 'u1'], messages: [
    { from: 'u1', text: 'Hey!! Loved your latest note', time: '09:40' },
    { from: 'u1', text: 'Your café guide was so helpful!', time: '09:42' },
  ], lastMessage: 'Your café guide was so helpful!', lastTime: '09:42', unread: 2 },
  { id: 'c2', participants: ['me', 'u3'], messages: [
    { from: 'u3', text: 'That Kyoto shot is insane', time: 'Yesterday' },
    { from: 'me', text: 'Thanks! Shot on expired Portra 400', time: 'Yesterday' },
    { from: 'u3', text: 'Send me the camera settings when free', time: 'Yesterday' },
  ], lastMessage: 'Send me the camera settings when free', lastTime: 'Yesterday', unread: 0 },
  { id: 'c3', participants: ['me', 'u2'], messages: [
    { from: 'u2', text: "Let's collab on a travel series? ✈️", time: 'Mon' },
  ], lastMessage: "Let's collab on a travel series? ✈️", lastTime: 'Mon', unread: 0 },
];
let scheduledPosts = [];
let collections = [
  { id: 'col1', name: 'Travel Inspo', icon: '✈️', noteIds: [] },
  { id: 'col2', name: 'Recipes', icon: '🍳', noteIds: [] },
  { id: 'col3', name: 'Style', icon: '👗', noteIds: [] },
  { id: 'col4', name: 'Home Decor', icon: '🏠', noteIds: [] },
];
let follows = {};
let userTheme = { mode: 'light', accent: '#ff2442', font: 'Inter', fontSize: 16 };
const chatReplyQueues = new Map();

function enqueueBotReply(chat, replies) {
  const previous = chatReplyQueues.get(chat.id) || Promise.resolve();
  const next = previous.then(() => new Promise(resolve => {
    setTimeout(() => {
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const time = new Date().toISOString();
      chat.messages.push({ from: chat.participants.find(p => p !== 'me'), text: reply, time });
      chat.lastMessage = reply;
      chat.lastTime = time;
      resolve();
    }, 1000);
  }));
  const queued = next.finally(() => {
    if (chatReplyQueues.get(chat.id) === queued) chatReplyQueues.delete(chat.id);
  });
  chatReplyQueues.set(chat.id, queued);
}

// ===== NOTES =====
/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, tags, author
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of notes
 */
app.get('/api/notes', (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  let filtered = [...notes];
  if (category && category !== 'All') {
    filtered = filtered.filter(n => n.cat === category);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.desc.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)) ||
      n.author.toLowerCase().includes(q)
    );
  }
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + Number(limit));
  res.json({ notes: paginated, total: filtered.length, page: Number(page), hasMore: start + Number(limit) < filtered.length });
});

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note found
 *       404:
 *         description: Note not found
 */
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               desc:
 *                 type: string
 *               cat:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               img:
 *                 type: string
 *               video:
 *                 type: string
 *               ratio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created
 *       400:
 *         description: Title is required
 */
app.post('/api/notes', (req, res) => {
  const { title, desc, cat, tags, img, video, ratio } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newNote = {
    id: 'n' + Date.now(),
    img: img || '',
    video: video || null,
    ratio: ratio || '4/5',
    cat: cat || 'Food',
    author: 'me',
    likes: 0,
    collects: 0,
    liked: false,
    collected: false,
    time: 'Just now',
    title,
    desc: desc || '',
    tags: tags || [],
    comments: [],
  };
  notes.unshift(newNote);
  res.status(201).json(newNote);
});

/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Update a note (like/collect)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               liked:
 *                 type: boolean
 *               collected:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Note updated
 *       404:
 *         description: Note not found
 */
app.patch('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  const { liked, collected } = req.body;
  if (typeof liked === 'boolean' && liked !== note.liked) {
    note.liked = liked;
    note.likes = Math.max(0, Number(note.likes || 0) + (liked ? 1 : -1));
  }
  if (typeof collected === 'boolean' && collected !== note.collected) {
    note.collected = collected;
    note.collects = Math.max(0, Number(note.collects || 0) + (collected ? 1 : -1));
  }
  res.json(note);
});

/**
 * @swagger
 * /api/notes/{id}/comments:
 *   post:
 *     summary: Add a comment to a note
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       400:
 *         description: Comment text is required
 *       404:
 *         description: Note not found
 */
app.post('/api/notes/:id/comments', (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });
  const comment = { who: 'me', text, time: 'Just now', likes: 0 };
  note.comments.push(comment);
  res.status(201).json(comment);
});

// ===== USERS =====
app.get('/api/users/me', (req, res) => {
  res.json(users.find(u => u.id === 'me'));
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user
 */
/**
 * @swagger
 * /api/users/{id}/follow:
 *   post:
 *     summary: Toggle follow a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow toggled
 */
app.post('/api/users/:id/follow', (req, res) => {
  const userId = req.params.id;
  follows[userId] = !follows[userId];
  res.json({ following: follows[userId] });
});

/**
 * @swagger
 * /api/users/me/stats:
 *   get:
 *     summary: Get current user stats
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User stats
 */
app.get('/api/users/me/stats', (req, res) => {
  const followingCount = Object.values(follows).filter(Boolean).length;
  const followerCount = Number(users.find(u => u.id === 'me')?.followers || 0);
  const myNotes = notes.filter(n => n.author === 'me');
  const totalLikes = myNotes.reduce((s, n) => s + n.likes, 0);
  const totalCollects = myNotes.reduce((s, n) => s + n.collects, 0);
  res.json({ following: followingCount, followers: followerCount, likes: totalLikes + totalCollects, postCount: myNotes.length });
});

// ===== NOTIFICATIONS =====
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 */
app.get('/api/notifications', (req, res) => {
  res.json({ notifications, unreadCount: notifications.filter(n => !n.read).length });
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
app.post('/api/notifications/read-all', (req, res) => {
  notifications.forEach(n => n.read = true);
  res.json({ success: true });
});

// ===== CHATS =====
/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get all chats
 *     tags: [Chats]
 *     responses:
 *       200:
 *         description: List of chats with other user info
 */
app.get('/api/chats', (req, res) => {
  const enriched = chats.map(c => {
    const otherUserId = c.participants.find(p => p !== 'me');
    const otherUser = users.find(u => u.id === otherUserId);
    return { ...c, otherUser };
  });
  res.json(enriched);
});

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     summary: Get a chat with messages
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat with messages
 *       404:
 *         description: Chat not found
 */
app.get('/api/chats/:id', (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json(chat);
});

/**
 * @swagger
 * /api/chats/{id}/messages:
 *   post:
 *     summary: Send a message in a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Message text is required
 *       404:
 *         description: Chat not found
 */
app.post('/api/chats/:id/messages', (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text is required' });
  const msg = { from: 'me', text, time: new Date().toISOString() };
  chat.messages.push(msg);
  chat.lastMessage = text;
  chat.lastTime = msg.time;
  const replies = ["Haha love that! 😆", "Omg yes!!", "Thanks for sharing 🥰", "Let's gooo 🔥", "Noted, thank you!!", "This made my day 🤍"];
  enqueueBotReply(chat, replies);
  res.status(201).json(msg);
});

// ===== COLLECTIONS =====
/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of collections
 */
app.get('/api/collections', (req, res) => {
  res.json(collections);
});

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Collection created
 *       400:
 *         description: Collection name is required
 */
app.post('/api/collections', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Collection name is required' });
  const col = { id: 'col' + Date.now(), name, icon: icon || '📁', noteIds: [] };
  collections.push(col);
  res.status(201).json(col);
});

/**
 * @swagger
 * /api/collections/{id}/notes:
 *   post:
 *     summary: Toggle a note in a collection
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [noteId]
 *             properties:
 *               noteId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added/removed from collection
 *       404:
 *         description: Collection not found
 */
app.post('/api/collections/:id/notes', (req, res) => {
  const col = collections.find(c => c.id === req.params.id);
  if (!col) return res.status(404).json({ error: 'Collection not found' });
  const { noteId } = req.body;
  if (!noteId) return res.status(400).json({ error: 'noteId is required' });
  if (!notes.some(note => note.id === noteId)) return res.status(404).json({ error: 'Note not found' });
  if (col.noteIds.includes(noteId)) {
    col.noteIds = col.noteIds.filter(n => n !== noteId);
    res.json({ removed: true, collection: col });
  } else {
    col.noteIds.push(noteId);
    res.json({ added: true, collection: col });
  }
});

// ===== SCHEDULED POSTS =====
/**
 * @swagger
 * /api/scheduled:
 *   get:
 *     summary: Get all scheduled posts
 *     tags: [Scheduled]
 *     responses:
 *       200:
 *         description: List of scheduled posts
 */
app.get('/api/scheduled', (req, res) => {
  res.json(scheduledPosts);
});

/**
 * @swagger
 * /api/scheduled:
 *   post:
 *     summary: Schedule a new post
 *     tags: [Scheduled]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduledFor]
 *             properties:
 *               title:
 *                 type: string
 *               desc:
 *                 type: string
 *               cat:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post scheduled
 *       400:
 *         description: Title and time required
 */
app.post('/api/scheduled', (req, res) => {
  const { title, desc, cat, scheduledFor } = req.body;
  if (!title || !scheduledFor) return res.status(400).json({ error: 'Title and time required' });
  const post = { id: 'sp' + Date.now(), title, desc, cat, scheduledFor, img: '', createdAt: new Date().toISOString() };
  scheduledPosts.push(post);
  res.status(201).json(post);
});

/**
 * @swagger
 * /api/scheduled/{id}:
 *   delete:
 *     summary: Delete a scheduled post
 *     tags: [Scheduled]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */
app.delete('/api/scheduled/:id', (req, res) => {
  scheduledPosts = scheduledPosts.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// ===== ANALYTICS =====
/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics stats, weekly views, engagement, and top posts
 */
app.get('/api/analytics', (req, res) => {
  const myNotes = notes.filter(n => n.author === 'me');
  const followerCount = Number(users.find(u => u.id === 'me')?.followers || 0);
  const totalViews = myNotes.reduce((s, n) => s + n.likes * 3 + n.collects * 5, 0);
  const totalLikes = myNotes.reduce((s, n) => s + n.likes, 0);
  const totalCollects = myNotes.reduce((s, n) => s + n.collects, 0);
  const totalComments = myNotes.reduce((s, n) => s + n.comments.length, 0);
  res.json({
    stats: [
      { label: 'Total Views', value: totalViews },
      { label: 'Total Likes', value: totalLikes },
      { label: 'Total Collects', value: totalCollects },
      { label: 'Comments', value: totalComments },
      { label: 'Followers', value: followerCount },
      { label: 'Posts', value: myNotes.length },
    ],
    weeklyViews: [320, 450, 380, 520, 610, 480, 560],
    weeklyEngagement: [45, 62, 38, 71, 85, 56, 78],
    topPosts: [...myNotes].sort((a, b) => (b.likes + b.collects) - (a.likes + a.collects)).slice(0, 5),
  });
});

// ===== AI CAPTIONS =====
/**
 * @swagger
 * /api/ai/captions:
 *   post:
 *     summary: Generate AI captions
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic]
 *             properties:
 *               topic:
 *                 type: string
 *               tone:
 *                 type: string
 *                 enum: [Casual, Professional, Funny, Poetic, Minimal, Hashtag Heavy]
 *     responses:
 *       201:
 *         description: Generated captions
 *       400:
 *         description: Topic is required
 */
app.post('/api/ai/captions', (req, res) => {
  const { topic, tone } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });
  const templates = {
    Casual: ["Loving this moment right now ✨", "Current mood: ☁️", "This is what dreams are made of 🌟", "Weekend vibes only 🎉", "Can't stop staring at this 😍", "Living my best life 💫"],
    Professional: ["Discovering new perspectives every day.", "Sharing insights from my latest experience.", "Elevating everyday moments into extraordinary memories.", "Curating the finest experiences, one note at a time."],
    Funny: ["My wallet is crying but my soul is thriving 😂", "Plot twist: I went back for seconds 🍕", "Adulting level: Expert (at making coffee) ☕", "This photo took 47 tries, you're welcome 📸"],
    Poetic: ["Where light meets shadow, beauty unfolds 🌅", "Every petal tells a story of patience 🌸", "In the quiet moments, we find our truest selves 🍃"],
    Minimal: ["Just this. Nothing more.", "Simple pleasures.", "Perfect.", "Worth saving."],
    'Hashtag Heavy': ["#livingmybestlife #aesthetic #vibes #mood #dailyinspo"],
  };
  const pool = templates[tone] || templates.Casual;
  const captions = [];
  for (let i = 0; i < 3; i++) {
    let cap = pool[Math.floor(Math.random() * pool.length)];
    if (tone === 'Hashtag Heavy') cap += ` #${topic.replace(/\s+/g, '').toLowerCase()} #explore #fyp`;
    else cap += ` — about ${topic}`;
    captions.push(cap);
  }
  res.json({ captions });
});

// ===== THEME =====
/**
 * @swagger
 * /api/theme:
 *   get:
 *     summary: Get user theme settings
 *     tags: [Theme]
 *     responses:
 *       200:
 *         description: Theme settings
 */
/**
 * @swagger
 * /api/theme:
 *   put:
 *     summary: Update theme settings
 *     tags: [Theme]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accent:
 *                 type: string
 *               font:
 *                 type: integer
 *               fontSize:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Theme updated
 */
app.get('/api/theme', (req, res) => res.json(userTheme));
app.put('/api/theme', (req, res) => {
  userTheme = { ...userTheme, ...req.body };
  res.json(userTheme);
});

app.listen(PORT, () => {
  console.log(`RedNote API running on http://localhost:${PORT}`);
});
