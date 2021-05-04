const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const {check, validationResult} = require('express-validator');
//@route GET api/auth
//@desc test route
//@access private
router.get('/',auth, async(req, res) =>{
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'server error'});
        
    }
});

//@route POST api/auth
//@desc user authnaticate user and get token
//@access public
router.post('/', 
check('email', 'please enter valid email').isEmail(),
check('password', 'password is required').exists(),
async (req, res) =>{

//check for validation
const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({erros: errors.array()});
}
const {email, password} = req.body; 

try {
let user = await User.findOne({email});

if(!user) return res.status(400).json({msg: "invalid credentails"});

const isMatch = await bcrypt.compare(password, user.password);
//compare password
if(!isMatch) return res.status(400).json({msg: "invalid credentails"});

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
    })


} catch (err) {
    console.error(err.message);
    res.status(500).json({msg: "server error"});
    
}
}
)



module.exports = router;