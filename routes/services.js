var express = require('express');
var router = express.Router();

const mongoose = require('mongoose');
//db setup
//cmd command for starting MongoDB: mongod.exe --dbpath "D:\MongoDB Databases\CallOfGripen_Services"
mongoose.connect('mongodb://localhost/callOfGripenDB');

//define the schema
let playerSchema = new mongoose.Schema({
    username: String,
    password: String,
    highscore: {type: Number, default: 0},
    scoredate: {type: Date, default: Date.now()}
});

// create the model
let userModel = mongoose.model('player', playerSchema);



/* GET home page. */
router.get('/players/', (req, res) => {
    res.status(200).send('OK');
});

router.get('/players', (req, res) => {

    res.json({result: "hello"});
});

/*Method for login
    returns:    200
                400 if username or password is undefined
                404 if username and password not match
                500 if something went wrong by querying MongoDB
*/
router.post('/players/login', (req, res, next) => {
    let player = req.body;
    if (player.username == undefined){
        res.status(400).send('Username is undefined');
        return;
    }

    if (player.password == undefined){
        res.status(400).send('Password is undefined');
        return;
    }

    userModel.findOne({username: player.username}, (err, result) =>{
        if (err){
            res.status(500).send('Internal server error');
            return;
        }
        else if (result == null) {
            res.status(404).send('Username or password are wrong');
        }
        else if (player.password === result.password) {
            res.status(200).json(result);
            return;
        }

    });
});

//Method for registration
router.post('/players', (req, res) => {
    let player = req.body;
    if (player.username == undefined){
        res.status(400).json({result: 'Username is undefined'});
        return;
    }

    if (player.password == undefined){
        res.status(400).json({result: 'Password is undefined'});
        return;
    }

    userModel.findOne({username: player.username}, (err, result) => {
        if (err){
            res.status(500).json(err);
        }
        else if (result == null) {
             let firstPlayer = new userModel(
                 {
                     username: player.username,
                     password: player.password
                 });
             firstPlayer.save();
             res.status(200).json({
                 _id: firstPlayer._id,
                 username: firstPlayer.username,
                 password: firstPlayer.password,
                 highscore: firstPlayer.highscore,
                 scoredate: firstPlayer.scoredate
             });

        }
        else {
             res.status(409).json({result: 'Player already exists'});
         }
    });
});

//Method for updating high score
router.put('/players/:id', (req, res) => {
    let player = req.body;
    if(player.highscore == undefined) {
        res.status(404).json({result: 'Highscore undefined'});
        return;
    }

    userModel.updateOne({_id: req.params.id},
        {$set: {highscore: player.highscore, scoredate: Date.now()}} ,
        (err, result) => {
            if (err) {
                res.status(500).json(err);
            }
            else if(result == null) {
                res.status(404).json({result: 'Player not found'});
            }
            else {
                res.status(200).json(result);
        }
    });
});

module.exports = router;