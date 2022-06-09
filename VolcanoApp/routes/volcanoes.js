const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    const { country, populatedWithin } = req.query;

    if (!country) {
        res.status(400).json({
            error: true,
            message: 'Country is a required query parameter.'
        });
        return;
    }

    req.db.from('data').select('id', 'name', 'country', 'region', 'subregion')
        .where({ country })
        .andWhere(function () {
            if (populatedWithin) { this.where(`population_${populatedWithin}`, '>', 0); }
        })
        .then((rows) => {
            res.status(200)
                .json(rows)
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: true,
                message: 'An error has occurred.'
            })
        })
});

module.exports = router;