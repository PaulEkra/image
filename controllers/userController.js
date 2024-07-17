import model from '../models/mongo.js';
import { createHash } from 'crypto';
import { validationResult, body } from 'express-validator';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const {User} = model;

const secretKey = process.env.SESSION_SECRET; //clé secrète utilisée pour signer le jeton

// Règles de validation pour chaque champ du formulaire
const bodyValidator = [
    body('username').notEmpty().withMessage('Le nom d\'utilisateur est requis'),
    body('email').notEmpty().withMessage('L\'adresse e-mail est requise').isEmail().withMessage('L\'adresse e-mail n\'est pas valide'),
    body('password').notEmpty().withMessage('Le mot de passe est requis').isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères')
];

const sessionMiddleware = (req, res, next) => {
  if (!req.session.id_user) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Middleware pour securisé les routes avec verification du token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization; // Récupérez le jeton d'authentification de l'en-tête de la requête

  if (!token) {
    return res.status(401).json({ message: 'Vous n\'etes pas autorisé à acceder à cette route !' });
  }

  try {
    const decoded = jwt.verify(token, secretKey); // Vérifiez et décodez le jeton

    // Ajoutez les informations de l'utilisateur décodées à la demande pour une utilisation ultérieure
    req.user = decoded;

    next(); // Passez à la prochaine fonction de middleware
  } catch (err) {
    return res.status(401).json({ message: 'Votre token est invalide !' });
  }
};

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { // Si Il y a des erreurs de validation
      req.session.errors = errors.array().map(err => err.msg); // stocker les messages d'erreur dans la session avant de rediriger l'utilisateur vers la page d'inscription
      return res.redirect("/register");
    }

    try { // Si le formulaire est valide
      const { username, email, password } = req.body;
      const safePwd = createHash('sha512').update(password).digest('base64');
      const avatar = "/uploads/" + req.file ? req.file.filename : null; // On recupère le nom du fichier de l'image ou null s'il n'y a pas d'image et on stocke dans le dossier
      const user = new User({ username, email, password:safePwd , avatar}); // On cree une instance du modèle User
      await user.save();
      req.session.id_user = user._id;
      return res.redirect('/photos');
    } catch (err) {
      req.session.errors = errors.array().map(err => err.msg);
      res.redirect("/register");
    }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const safePwd = createHash('sha512').update(password).digest('base64');
    const user = await User.findByCredentials(email, safePwd);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides !!' });
    }

    // Connexion réussie, envoyez la requête à l'API OTP
    const otpResponse = await axios.post('http://localhost:8000/otp/generate/', {
      email: user.email // Utilisez l'email de l'utilisateur connecté
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Retourner une réponse de succès
    res.status(200).json({
      message: 'Connexion réussie. OTP envoyé.',
      otpResponse: otpResponse.data
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getLogin = (req, res) => {
  res.render('login', { title: 'Espace membre'});
};

const getRegister = (req, res) => {
  const errors = res.locals.errors; // récupérer les messages d'erreur de res.locals.errors et les afficher dans votre template de page d'inscription
  res.render('register', { title: 'Espace membre', errors});
};

const logout = async (req, res) => {
  req.session.destroy((err) => { // On detruit la session,
    if (err) { // Si il y'a erreur
      return res.redirect("/"); // On retourne la page d'index
    }
    res.clearCookie(process.env.SESSION_NAME); // Si il n'y a pas d'erreur on efface les cookie
    res.redirect("/");
  });
};


export default {
  register, login, getLogin, getRegister, bodyValidator, authMiddleware, sessionMiddleware, logout
};
