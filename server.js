import express from 'express';
import bodyParser from 'body-parser';
import Router from './routes.js';
import model from './models/mongo.js';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors package
dotenv.config();

const { User } = model;

const app = express();
const port = 5000;

app.set('views', './views');
app.set('view engine', 'ejs');

// Configuration du middleware de session
app.use(session({
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: true,
    secure: false, // Set to true in production if using HTTPS
  },
}));

// Middleware to fetch user data from session
app.use(async (req, res, next) => {
  const { id_user } = req.session;
  if (id_user) {
    try {
      const user = await User.findOne({ _id: id_user });
      res.locals.user = user;
    } catch (err) {
      console.error(err);
    }
  }
  next();
});

// Custom error handling middleware
app.use((req, res, next) => {
  res.locals.errors = req.session.errors || {};
  req.session.errors = {};
  next();
});

// Enable CORS for all origins
app.use(cors());

app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', Router);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
