var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/player', (req, res) => {
    let input = res.query.text;
    res.json({result: input.toUpperCase()});
});

router.get('/players', (req, res) => {

    res.json({result: "hello"});
});


module.exports = router;