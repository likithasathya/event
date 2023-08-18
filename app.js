const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');

// Set up PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'event_plan',
  password: 'root',
  port: 5432,
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(express.static('public')); // Static files like CSS and Bootstrap

// Routes
app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
    await pool.query(query, [name, email, password]);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error while inserting user:', err);
    res.redirect('/signup');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = 'SELECT * FROM users WHERE email = $1 AND password = $2';
    const { rows } = await pool.query(query, [email, password]);
    if (rows.length === 1) {
      req.session.user = rows[0].name;
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error while querying user:', err);
    res.redirect('/login');
  }
});

app.get('/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user) {
    res.redirect('/login');
  } else {
    res.render('dashboard', { user });
  }
});

app.get('/event-selection', (req, res) => {
  res.render('event_selection');
});

app.get('/event/marriage', (req, res) => {
  res.render('marriage');
});

app.get('/event/anniversary', (req, res) => {
  res.render('anniversary');
});

app.get('/event/birthday', (req, res) => {
  res.render('birthday');
});

app.get('/billing/:event/:package', (req, res) => {
  const { event, package } = req.params;
  const total = calculateTotalPrice(event, package);
  res.render('billing', { event, package, total });
});

app.post('/thank-you', (req, res) => {
  const { name, email, phone, event, package, people, total } = req.body;
  // Save the data to the database here
  const query = 'INSERT INTO bookings (name, email, phone, event, package, people, total) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  pool.query(query, [name, email, phone, event, package, people, total])
    .then(() => {
      res.render('thank_you', { name, event, package, total });
    })
    .catch((err) => {
      console.error('Error while inserting booking:', err);
      res.redirect(`/billing/${event}/${package}`); // Redirect to billing page on error
    });
});

// Helper function to calculate total price
function calculateTotalPrice(event, package) {
  // Replace this with your calculation logic based on event and package
  // For simplicity, let's assume a fixed price for each package
  const priceMap = {
    'marriage': {
      'gold': 2000,
      'platinum': 3000,
      // Add more packages as needed
    },
    'anniversary': {
      'silver': 1000,
      'gold': 1500,
      // Add more packages as needed
    },
    'birthday': {
      'basic': 500,
      'deluxe': 800,
      // Add more packages as needed
    },
  };

  return priceMap[event][package] || 0;
}

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
