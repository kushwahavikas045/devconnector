const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const {check, validationResult} = require('express-validator');
const User = require('../../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
//@route POST api/users
//@desc register users
//@access public
router.post('/',[
    check('name', 'name is required').not().isEmpty(),
    check('email', 'please include valid email').isEmail(),
    check('password','Please enter a password with 6 or more characters').isLength({ min: 6 }),
], async(req, res) =>
{
    //validation 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()})
    }
    const {name, email, password} = req.body;
    try {
        let user = await User.findOne({email});

        if(user){
            res.status(400).json({errors : [{msg: "user already exists..."}]})
        }
        //avatar
    const avatar = gravatar.url(email, {
        f: 'y',
        s: '200',
        r: 'pg',
        d: '404'
    });

    //new users add to database
    user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();
 
 
      //jwt define
      const payload = {
          user: {id: user.id}
      };

      jwt.sign(payload,
         config.get('jwtToken'),
         {expiresIn: 36000},
         (err, token) =>{
             if(err) throw err;
             res.json({token})
         }
         )
  
        } catch (err) {
        console.error(err.message);
       res.status(500).send('server errors');     
    }
    
})
module.exports = router;


