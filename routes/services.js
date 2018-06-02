var express = require('express');
var router = express.Router();

const mongoose = require('mongoose');
//db setup
//cmd command for starting MongoDB: mongod.exe --dbpath "D:\MongoDB Databases\CallOfGripen_Services"
var connection_string = 'mongodb://localhost/callOfGripenDB';
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
    config.db.mongo.url = connection_string;
}

mongoose.connect(connection_string);

//define the schema
let playerSchema = new mongoose.Schema({
    username: String,
    password: String,
    highscore: {type: Number, default: 0},
    scoredate: {type: Date, default: Date.now()}
});

// create the model
let userModel = mongoose.model('player', playerSchema);

//Method for high score
//returns the 10 best scores descending
router.get('/players', (req, res) => {
    userModel.find({}).sort({highscore: -1}).find((err, result) =>{
        if (err) {
            res.status(500).send('Internal server error');
            return;
        }
        else{
            res.status(200).json(result);
        }
        }).limit(10);
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
        res.status(400).send('Username is undefined');
        return;
    }

    if (player.password == undefined){
        res.status(400).send('Password is undefined');
        return;
    }

    if (player.username.length < 3){
        res.status(400).send('Username must consist of at least 3 characters');
        return;
    }

    if (player.password.length < 6){
        res.status(400).send('Password must consist of at least 6 characters');
        return;
    }

    userModel.findOne({username: player.username}, (err, result) => {
        if (err){
            res.status(500).send('Internal server error');
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
             res.status(409).send('Username already exists');
         }
    });
});

//Method for updating high score
router.put('/players/:id', (req, res) => {
    let player = req.body;
    if (player.highscore == undefined) {
        res.status(404).json({result: 'Highscore undefined'});
        return;
    }

    userModel.findOne({_id: req.params.id}, (err, result) => {
        if (err) {
            res.status(500).send('Internal Server error');
        }
        else if (result == null) {
            res.status(404).send('Player not found');
        }
        //Only update the DB when the new high score is higher than the old one.
        else if (result.highscore < player.highscore) {
            userModel.updateOne({_id: req.params.id},
                {$set: {highscore: player.highscore, scoredate: Date.now()}},
                (err2, result2) => {
                    if (err) {
                        res.status(500).send('Internal Server error');
                    }
                    else {
                        res.status(200).json(result2);
                    }
                });
        }
        else {
            res.status(200).json(result);
        }
    });
});

module.exports = router;