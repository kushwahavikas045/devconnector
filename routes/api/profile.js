const express = require('express');
const router = express.Router();
const config = require('config');
const request = require('request');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Porfile = require('../../models/Profile');
const User = require('../../models/Users');
const {check, validationResult} = require('express-validator');
//@route GET api/profile/me
//@desc gwt user profile
//@access public
router.get('/me',auth, async(req, res) =>{
   try {
       const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);

       if(!profile) return res.status(400).json({msg: "profile not found"});

       res.json(profile);

   } catch (err) {
       console.error(err.message);
       res.status(500).json('server error');
   }
});
//@route post api/profile
//@desc post user profile
//@access public
router.post('/', 
auth,
check('status', 'status is required').notEmpty(),
check('skills', 'skills is required').notEmpty(),
 async (req, res) =>{

    //check validation
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    
     // destructure the request
     const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        
      } = req.body;
 
      //bulid profile object
      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (location) profileFields.location = location;
      if (website) profileFields.website = website;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;
      if(skills){
          profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        //bulid social media object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({user: req.user.id});
            //if profile than update
            if(profile){
            profile = await Profile.findOneAndUpdate({user:req.user.id}, {$set: profileFields},{new: true});
            return res.json(profile);
            }    
            //create profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        

        } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
        }

});


//@route post api/profile
//@desc get all profile
//@access public

router.get('/', async(req, res) =>{
  try {
    let profile = await Profile.find().populate('user',['name','avatar']);

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
    
  }
});


//@route get api/profile/user/user_id
//@desc get profile by user id
//@access public

router.get('/user/:user_id', async(req, res) =>{
  try {
    let profile = await Profile.findOne({user : req.params.user_id}).populate('user',['name','avatar']);
    
    if(!profile){
       return res.status(400).json({msg: "profile not found!"});
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if(err.Kind == 'ObjectId'){
      return res.status(400).json({msg: "profile not found!"});
    }
    res.status(500).send('server error');
    
  }
});

//@route delete api/profile
//@desc delete user profile
//@access private

router.delete('/',auth, async(req, res) =>{
  try {
    //delete profile
    await Profile.findOneAndRemove({user : req.user.id});
    //delete user
    await User.findOneAndRemove({_id: req.user.id});

    res.json({msg: "user deleted"});
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
    
  }
});

//@route put api/profile/experience
//@desc Add experience to profile
//@access private

router.put('/experience',[auth, [
  check('title', 'title is required').not().isEmpty(),
  check('company', 'company is required').not().isEmpty(),
  check('from', 'Form date is required').not().isEmpty(),
]], async(req, res) =>{

  //check validation
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors : errors.array()});
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  };

  try {
   const profile = await Profile.findOne({user: req.user.id});
   
   profile.experience.unshift(newExp);

   await profile.save();

   res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
    
  }
  
});


//@route  PATCH api/profile/education
//@desc   Add education to profile
//@access Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
      check("fieldofstudy", "Field of study date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      // unshift is similar to push() but it pushes to the begining rather than to the end.
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);


//@route delete api/profile/experience/:exp_id
//@desc delete user experience using experience id
//@access private

router.delete('/experience/:exp_id',auth, async(req, res) =>{
  try {
   let profile = await Profile.findOne({user : req.user.id});

   let removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
   
   profile.experience.splice(removeIndex, 1);

   await profile.save();
   res.json(profile);

  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
    
  }  
});


//@route delete api/profile/education/:edu_id
//@desc delete user education using education id
//@access private

router.delete('/education/:edu_id',auth, async(req, res) =>{
  try {
   let profile = await Profile.findOne({user : req.user.id});

   let removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
   
   profile.education.splice(removeIndex, 1);

   await profile.save();
   res.json(profile);

  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
    
  }  
});


//@route get api/profile/github/username
//@desc get github repos using github username
//@access public

router.get('/github/:username',(req, res) =>{
  try {
   const options = {
     uri : `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
     method:'GET',
     headers:{'user-agent':'node.js'}
   };
   request(options, (error, response, body) =>{
     if(error) console.error(error.message);
     if(response.statusCode !== 200) {
      return res.status(404).json({msg:"github profile not found"});
     }
     res.json(JSON.parse(body)); 
   })

  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
    
  }  
});

module.exports = router;