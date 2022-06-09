const express = require('express');
const router = express.Router();

router.get('/', function(req, res) { 
    const country = req.query.country;
    const populatedWithin = req.query.populatedWithin;

    if (!country) { 
        res.status(400).json({
            error: true,
            message: `Country is a required query parameter.`
        }); 
        return; 
    }

    const validPopulatedWithin = ['5km', '10km', '30km', '100km']

    if (populatedWithin && !validPopulatedWithin.includes(populatedWithin)) { 
        res.status(400).json({
            error: true,
            message: `Invalid value for populatedWithin: ${populatedWithin}. Only ${validPopulatedWithin.join(',')} are permitted.`
        }); 
        return; 
    }

    for (const item of Object.keys(req.query)) { 
        if (item !== 'country' && item !== 'populatedWithin') { 
            res.status(400).json({
                error: true,
                message: `Invalid query parameters. Only country and populatedWithin are permitted.`
            }); 
            return;
        }
    }

    req.db.from('data').select('id', 'name', 'country', 'region', 'subregion').where({ country: country }).andWhere(function() { 
        if (populatedWithin) { this.where(`population_${populatedWithin}`, '>', 0); }
    })
    .then((rows) => {
        res.status(200).json(rows)
    })
    .catch((err) => { 
        console.log(err);
        res.status(500).json({
            error: true, 
            message: 'An interal server error occurred.'
        })
    })
});

module.exports = router;