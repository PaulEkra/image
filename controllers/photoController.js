import model from '../models/mongo.js';

const {Photo} = model

const getAllPhotos = async (req, res) => {
    try {
      const { user } = res.locals; // On recupère depuis local l'utilisateur
      const photos = await Photo.find().populate('comments.user'); // On recupère les photos // populate pour récupérer les détails de l'utilisateur connecté
      res.render('pictures', { user, photos });
    } catch (error) {
      res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des photos' });
    } 
};

const addPhoto = (req, res) => {
    const {title} = req.body
    const imageUrl = "/uploads/" + req.file ? req.file.filename : null;
    const userId = req.session ? req.session.id_user : null; // On recupère l'utilisateur connecté pour l'associé à l'enregistrement 
    
    if (!userId) {
        return res.status(401).json({ message: 'Utilisateur non connecté' });
    } 
    
    const newImage = new Photo({title, imageUrl, user: userId, comments: [], likes: []}); // Ajouter les commentaires et les likes concernat l'image  

    newImage.save()
    //.then(image => res.status(201).json("New image added"))
    //.catch(error => res.status(500).json({ message: error }));
    //.then(image => res.render('pictures', {image}))
    .then(() => {
        Photo.find() // Recupérer les images et les afficher
          .then(photos => res.render('pictures', { photos }))
          .catch(error => res.status(500).json({ message: error }));
      })
    .catch(error => res.status(500).json({ message: error }));
};

const addComment = (req, res) => {
  const { photoId, commentText } = req.body;

  Photo.findById(photoId)
    .then(photo => {
      if (!photo) {
        return res.status(404).json({ message: 'Photo non trouvée' });
      }

      const comment = {
        text: commentText,
        user: req.session.id_user,
        username: req.session.username // Ajoutez le nom d'utilisateur dans le commentaire
      };

      photo.comments.push(comment);

      photo.save()
        .then(() => {
          res.redirect(`/photos`);
        })
        .catch(error => res.status(500).json({ message: error }));
    })
    .catch(error => res.status(500).json({ message: error }));
};

const addLike = (req, res) => {
  const { photoId } = req.body;

  // On recherche la photo à travers son id
  Photo.findById(photoId)
    .then(photo => {
      if (!photo) {
        return res.status(404).json({ message: 'Photo non trouvée' });
      }

      const userId = req.session.id_user;

      // Vérifier si l'utilisateur a déjà aimé la photo
      const alreadyLiked = photo.likes.some(like => like.user.toString() === userId);

      if (alreadyLiked) {
        // Si l'utilisateur a déjà aimé, supprimer le like
        photo.likes = photo.likes.filter(like => like.user.toString() !== userId);
      } else {
        const like = {
          user: userId
        };
        photo.likes.push(like);
      }

      // Enregistrer la photo mise à jour
      photo.save()
      .then(() => {
        res.redirect(`/photos`);
      })
      .catch(error => {
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la photo' });
      });
    })
    .catch(error => {
      res.status(500).json({ message: 'Erreur lors de la recherche de la photo' });
    });
};

/*const putPhoto = (req, res) => {
  let photoId = req.params.photoId;
  let newTitle = req.body.title;
  const userId = req.session.id_user;

  // Vérifier si l'utilisateur est autorisé à modifier la photo
  if (userId === photo.userId) {
    // Effectuer les opérations de mise à jour du titre de la photo dans la base de données
    Photo.findByIdAndUpdate(photoId, { title: newTitle })
      .then(() => {
        // Mise à jour réussie, envoyer une réponse de succès
        res.sendStatus(200);
      })
      .catch(error => {
        // Une erreur s'est produite lors de la mise à jour de la photo
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la photo' });
      });
  } else {
    // L'utilisateur n'est pas autorisé à effectuer cette action
    res.sendStatus(403);
  }
};*/

const  putPhoto = (req, res) => {
  Photo.updateOne({ _id: req.params.photoId }, { ...req.body, _id: req.params.photoId })
  .then(() => res.status(200).json({ message: 'Photo modifié !'}))
  .catch(error => res.status(400).json({ error }));
};

/*const deletePhoto = (req, res) => {
  let photoId = req.params.photoId;

  // Vérifier si l'utilisateur est autorisé à supprimer la photo
  if (req.user && req.user.id === photo.userId) {
    // Effectuer les opérations de suppression de la photo dans la base de données
    Photo.findByIdAndDelete(photoId)
      .then(() => {
        // Suppression réussie, envoyer une réponse de succès
        res.sendStatus(200);
      })
      .catch(error => {
        // Une erreur s'est produite lors de la suppression de la photo
        res.status(500).json({ message: 'Erreur lors de la suppression de la photo' });
      });
  } else {
    // L'utilisateur n'est pas autorisé à effectuer cette action
    res.sendStatus(403);
  } 
};*/

const deletePhoto = (req, res) => {
  Photo.deleteOne({ _id: req.params.photoId })
    .then(() => res.status(200).json({ message: 'Photo supprimée !' }))
    .catch(error => res.status(400).json({ error }));
};
 
export default {
    getAllPhotos, addPhoto, addComment, addLike, deletePhoto, putPhoto
};