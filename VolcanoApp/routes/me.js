const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({
      name: 'Jarryd Stringfellow',
      student_number: 'n9734074'
  });
});

module.exports = router;