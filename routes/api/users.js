const express = require('express');
const router = express.Router();
const gravator = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { body, validationResult } = require('express-validator');

const Users = require('../../models/Users');

router.post(
  '/',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid Email id').isEmail(),
    body(
      'password',
      'Please enter a password with 6 characters or more'
    ).isLength({ min: 6 }),
  ],

  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if a user exists
      let user = await Users.findOne({ email });

      if (user) {
        res.status(400).json({ error: [{ msg: 'User alreadt exists' }] });
      }

      //get users gravator
      const avatar = gravator.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

       user = new Users({
        name,
        email,
        avatar,
        password
      });

      //Encrypt password

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

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
