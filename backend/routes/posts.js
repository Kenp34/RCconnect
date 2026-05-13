const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Post = require('../models/Post');
const upload=require('../middleware/Upload');

router.get('/feed', protect, async (req, res) => {
  try {
    // Construire la liste : mes abonnements + moi-même
    const ids = [...req.user.following, req.user._id];

    const posts = await Post.find({ author: { $in: ids } })
      .populate('author', 'name avatar department')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })  // Plus récent en premier
      .limit(20);               // Pagination simple

    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const postData = {
      author: req.user._id,
      content: req.body.content,
      // Si une image est uploadée, on stocke son chemin
      image: req.file ? `/uploads/${req.file.filename}` : null
    };

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar department');
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});



router.post('/:id/like', protect, async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post introuvable"
            });
        }

        // Vérifier si l'utilisateur a déjà liké
        const liked = post.likes.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (liked) {

            // Retirer le like
            post.likes = post.likes.filter(
                (id) => id.toString() !== req.user._id.toString()
            );

        } else {

            // Ajouter le like
            post.likes.push(req.user._id);
        }

        await post.save();

        res.status(200).json({
            likes: post.likes.length,
            liked: !liked
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });
    }
})


// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });
    await post.deleteOne();
    res.json({ message: 'Post supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    await post.populate('comments.user', 'name avatar');
    res.json(post.comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
})

module.exports=router;