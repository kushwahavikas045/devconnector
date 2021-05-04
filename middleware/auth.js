const jwt = require('jsonwebtoken');
const config = require('config');


module.exports = function(req, res, next){
    //get token form header
    const token = req.header('x-auth-token');

    //check token
    if(!token) return res.status(401).json({msg : "No token, authorization denied!"});
   
    //verify token
    try {
        jwt.verify(token, config.get('jwtToken'), (error, decoded) =>{
            if(error) {
                return res.status(401).json({msg: 'Token is not valid'})
            }else{
                req.user = decoded.user;
                next();
            }
        })
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg :'server errors'})
        
    }
}