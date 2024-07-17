import express from 'express';
import multer from 'multer';
import userController from './controllers/userController.js';
import photoController from './controllers/photoController.js';

const Router = express.Router();
const {register, login, getLogin, getRegister, sessionMiddleware, logout} = userController;
const {getAllPhotos, addPhoto, addComment, addLike, putPhoto, deletePhoto} = photoController;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/uploads/"); // Répertoire de destination pour les fichiers téléchargés
    },
    filename: (req, file, cb) => {
      const uniquePrefixe = Math.round(Math.random() * 100); // On génère des nombres aléatoire pour completer le debut du fichier
      cb(null, uniquePrefixe + '_' + file.originalname); // Nom des fichiers téléchargés
    },
  }); 

const upload = multer({
    storage: storage, // Répertoire de destination pour les fichiers téléchargés
});

Router.get('/', (req, res) => {
    res.render('index');
    console.log(req.session);
});

// Routes pour les utilisateurs
Router.post('/register', upload.single('avatar'), register);
Router.post('/login', login);
Router.get('/login', getLogin);
Router.get('/register', getRegister);
Router.post('/logout', logout);

// Routes pour les photos
Router.post('/photos', sessionMiddleware, upload.single('imageUrl'), addPhoto); 
Router.get('/photos', sessionMiddleware, getAllPhotos);
Router.put('/photos/:photoId', sessionMiddleware, putPhoto);
Router.delete('/photos/:photoId', sessionMiddleware, deletePhoto);


// Routes pour les commentaires
Router.post('/photos/:photoId/comments', sessionMiddleware, addComment);
//Router.get('/photos/:photoId/comments', commentController.getComments);
Router.post('/photos/:photoId/likes', sessionMiddleware, addLike);

/*
Router.get('/users', userController.getAllUsers);
Router.get('/users/:id', userController.getUser);
Router.put('/users/:id', userController.updateUser);
Router.delete('/users/:id', userController.deleteUser);


Router.get('/photos/:id', photoController.getPhoto);

// Routes pour les commentaires
Router.get('/photos/:photoId/comments', commentController.getComments);
Router.put('/comments/:id', commentController.updateComment);
Router.delete('/comments/:id', commentController.deleteComment);*/
 
export default Router; 