const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authorize = function (req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || auth.split(" ").length != 2) {
    res.status(401).json({
      "Error": true,
      "Message": "Missing or malformed JWT"
    });
    return;
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, secretKey);
    if (Date.now() > payload.exp) {
      res.status(401).json({
        "Error": true,
        "Message": "Expired JWT"
      });
      return;
    }
  } catch (e) {
    res.status(401).json({
      "Error": true,
      "Message": "Invalid JWT"
    });
    return;
  }
  next();
}

router.post('/register', function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(500).json({
      Error: true,
      Message: "Request body incomplete, both email and password are required"
    });
    return
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    res.status(400).json({
      Error: true,
      Message: "Invalid format email address"
    });
    return;
  }

  req.db.from("Users").select("*").where({ email })
    .then(
      users => {
        if (users.length > 0) {
          res.status(409).json({
            Error: true,
            Message: "User already exists"
          });
          return;
        }

        const hash = bcrypt.hashSync(password, 10)

        req.db.from("Users").insert({ email, hash })
          .then(() => {
            res.status(201).json({
              Error: false,
              Message: "User created"
            });
          })
          .catch(err => {
            console.log(err);
            res.status(400).json({
              Error: true,
              Message: "Request body incomplete, both email and password are required"
            })
          })
      })
    .catch(err => {
      console.log(err);
      res.status(400).json({
        Error: true,
        Message: "Request body incomplete, both email and password are required"
      })
    });
});

router.post('/login', function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      Error: true,
      Message: "Request body incomplete, both email and password are required"
    });
    return
  }

  req.db.from("Users").select("*").where({ email })
    .then(
      users => {
        if (users.length === 0) {
          res.status(401).json({
            Error: true,
            Message: "Incorrect email or password"
          });
          return;
        }

        const { hash } = users[0];

        if (!bcrypt.compareSync(password, hash)) {
          res.status(401).json({
            Error: true,
            Message: "Incorrect email or password"
          });
          return;
        }

        const expires_in = 60 * 60 * 24;
        const exp = Date.now() + expires_in * 1000;
        const token = jwt.sign({ email, exp }, secretKey)

        res.json({
          token,
          token_type: "Bearer",
          expires_in
        })
      })
    .catch(err => {
      console.log(err);
      res.status(401).json({
        Error: true,
        Message: "Incorrect email or password"
      })
    });
});

router.get('/:email/profile', authorize, function (req, res) {
  const email = req.params.email;

  req.db.from('users').first('*').where({ email })
    .then((user) => {
      if (!user) {
        res.status(404).json({
          error: true,
          message: 'User not found'
        });
        return;
      }

      let userInfo = {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }

      if (req.token) {
        const jwtCheck = jwt.verify(req.token, process.env.SECRET_KEY);

        if (req.isAuthenticated && jwtCheck.email === email) {
          userInfo.dob = user.dob;
          userInfo.address = user.address;
        }
      }
      res.status(200).json(userInfo);
    });
});

router.put('/:email/profile', authorize, function (req, res) {
  if (!req.isAuthenticated) {
    res.status(401).send({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
    return;
  }

  const email = req.params.email;
  const userDetails = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    dob: req.body.dob,
    address: req.body.address
  }

  if (!userDetails.first_name || !userDetails.last_name || !userDetails.dob || !userDetails.address) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    });
    return;
  }

  const emailCheck = jwt.verify(req.token, process.env.SECRET_KEY);

  if (emailCheck.email !== email) {
    res.status(403).json({
      error: true,
      message: 'Forbidden'
    });
    return;
  }

  req.db.from('users').update(userDetails).where({ email })
    .then(() => {
      return req.db.from('users').first('*').where({ email })
    })
    .then((user) => {
      res.status(200).json({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        dob: user.dob,
        address: user.address
      });
    })
});

module.exports = router;
