const express = require('express');
const {check, validationResult} = require('express-validator');
const router = express.Router();
const User = require('../../models/Users');
const Post = require('../../models/Post');
const auth = require('../../middleware/auth');


//@route  POST api/posts/comment/:post_id
//@desc   Comment on a post
//@access Private
router.post(
    "/comment/:post_id",
    [auth, [check("text", "Text is required").not().isEmpty()]],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }
      try {
        const user = await User.findById(req.user.id).select("-password");
        const post = await Post.findById(req.params.post_id);
        if (!post) {
          return res.status(400).json({
            message: "Post not found.",
          });
        }
        const newComment = {
          text: req.body.text,
          name: user.name,
          avatar: user.avatar,
          user: req.user.id,
        };
        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);
      } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
      }
    }
  );
//@route GET api/posts 
//@desc get all post
//@access private

router.get('/', auth, async (req, res) =>{
    try {
       const posts = await Post.find().sort({date: -1});
       res.json(posts);        
    } catch (err) {
        console.error(err.message);
        return  res.status(500).json({msg: 'server error'});
        
    }
});


//@route GET api/posts/:id 
//@desc get  post by id
//@access private

router.get('/:id', auth, async (req, res) =>{
    try {
       const post = await Post.findById(req.params.id);
       if(!post){
           return res.status(404).json({msg: "post not found"})
       }
       res.json(post);        
    }catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({msg: "post not found"})
        }
        return  res.status(500).json({msg: 'server error'});
        
    }
});

//@route delete api/posts/:id 
//@desc  delete post by id
//@access private

router.delete('/:id', auth, async (req, res) =>{
    try {
       const post = await Post.findById(req.params.id);
       if(!post){
        return res.status(404).json({msg: "post not found"})
    }
       //check
       if(post.user.toString() !== req.user.id){
           return res.status(401).json({msg:'user not authorized'})
       }
        await post.remove();

       res.json({msg:"post removed"});        
    }catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({msg: "post not found"})
        }
        return  res.status(500).json({msg: 'server error'});
        
    }
});

//@route  Put api/posts/like/:post_id
//@desc   Like a post by id
//@access Private
router.put("/like/:post_id", auth, async (req, res) => {
    try {
      // Find the post by id
      const post = await Post.findById(req.params.post_id);
  
      // Check if the post has already been liked by the current user
      if (
        post.likes.filter((like) => like.user.toString() === req.user.id).length >
        0
      ) {
        return res
          .status(400)
          .json({ message: "Post already liked by this user" });
      }
      post.likes.unshift({ user: req.user.id });
      await post.save();
      res.json(post.likes);
    } catch (error) {
      console.log(error.message);
      if (error.kind === "ObjectId") {
        return res.status(400).json({
          message: "Post not found.",
        });
      }
      res.status(500).send("Server Error");
    }
  });

//@route  Put api/posts/unlike/:post_id
//@desc   unlike a post by id
//@access Private
router.put("/unlike/:post_id", auth, async (req, res) => {
    try {
      // Find the post by id
      const post = await Post.findById(req.params.post_id);
  
      // Check if the post has already been liked by the current user
      if (post.likes.filter((like) => like.user.toString() === req.user.id).length === 0) {
        return res
          .status(400)
          .json({ msg: "Post has not yet been liked by this user" });
      }
      const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
      post.likes.splice(removeIndex,1)
      await post.save();
      res.json(post.likes);
    } catch (error) {
      console.log(error.message);
      if (error.kind === "ObjectId") {
        return res.status(400).json({
          message: "Post not found.",
        });
      }
      res.status(500).send("Server Error");
    }
  });

//@route  Put api/posts/comment/:comment_id
//@desc   comment a post by id
//@access Private

router.post('/comment/:comment_id',[auth,[
    check('text', 'text is required').not().isEmpty()
]], async(req, res)=>{

const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()})
}

try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.comment_id);

    const newComment = {
        text: req.body,
        name: user.name,
        avatar: user.avatar,
        user : req.user.id
    }

    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments);

} catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
    
}
});


//@route  DELETE api/posts/comment/:post_id/:comment_id
//@desc   Delete a comment
//@access Private
router.delete('/comment/:post_id/:comment_id', auth, async(req, res) =>{

    try {
        const post = await Post.findById(req.params.post_id);
        // Get the comment from the post
        const comment = post.comments.find((comment) => comment.id == req.params.comment_id);
        
        if(!comment) {
            return res.status(404).json({msg:" comment not found"});
        }
        //Check if user is the owner of the comment
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg: "User not authorized"});
        }

    
       // Get remove index
        const removeIndex = post.comments.map((comment) => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();
        res.json(post.comments)



    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
        }

})


module.exports = router;