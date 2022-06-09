const express = require('express');
const router = express.Router();

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

router.get('/:id', authorize, function (req, res) {
  const queryParams = Object.keys(req.query);

  if (queryParams.length > 0) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Query parameters are not permitted."
    });
    return;
  }

  const id = req.params.id;
  const selectColumns = ['id', 'name', 'country', 'region', 'subregion', 'last_eruption', 'summit', 'elevation', 'latitude', 'longitude'];

  if (req.isAuthenticated) {
    Array.prototype.push.apply(selectColumns,
      ['population_5km', 'population_10km', 'population_30km', 'population_100km']);
  }

  req.db.from('data').first(selectColumns).where({ id })
    .then((row) => {
      if (!row) {
        res.status(404).json({
          error: true,
          message: `Volcano with ID: ${req.params.id} not found.`
        });
        return;
      }
      res.status(200).json(row)
    })
});

module.exports = router;