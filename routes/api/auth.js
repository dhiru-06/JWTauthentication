const express = require("express");
const router = express.Router();
const Users = require('../../models/Users');
const authm = require('../../middleware/authm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { body, validationResult } = require('express-validator');


router.get("/",authm, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id).select('-password');
        res.json({user});
        
    } catch (error) {
        
        console.error(error.message);
        res.status(500).send('server error');
    }
});

router.post(
    '/',
    [
      body('email', 'Please include a valid Email id').isEmail(),
      body(
        'password',
        'password is required'
      ).exists()
    ],
  
    async (req, res) => {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
      }
  
      const { email, password } = req.body;
  
      try {
        //see if a user exists
        let user = await Users.findOne({ email });
  
        if (!user) {
          res.status(400).json({ error: [{ msg: 'Invalid Credentials' }] });
        }
  

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            res.status(400).json({msg: 'Invalid Credentials'});
        }
      
  
        //return jsonwebtoken
  
        const payload = {
          user: {
            id : user.id
          }
        }
  
        jwt.sign(
          payload,
          config.get('jwtSecret'),
          {expiresIn: 360000},
          (err, token) => {
            if(err) throw err;
            res.json({token});
          }
          );
  
  
       
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
      }
    }
  );

module.exports = router;
