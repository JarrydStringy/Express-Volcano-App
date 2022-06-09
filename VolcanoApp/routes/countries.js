const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) { 
    req.db.from('data')
    .then(
        (rows) => {
        const countries = rows.map((row) => row.country)
        res.status(200).json(countries)
    })
    .catch((err) => { 
        console.log(err);
        res.status(400).json({
            error: true, 
            message: 'Invalid query parameters. Query parameters are not permitted.'
        });
    })
});

module.exports = router;