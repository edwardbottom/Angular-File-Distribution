const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser')
const app = express();
const router = express.Router();
const AWS = require('aws-sdk');
const util = require('util');
const mongodb = require("mongodb");


//aws setup
AWS.config.update({
    accessKeyId: "AKIAIM3WY3FAQRXZ2LUQ",
    secretAccessKey: "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"
  });
const DIR = './uploads';
var s3 = new AWS.S3();

//mongo credentials
const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = 'mongodb://edward:Duckunder4!@ds139267.mlab.com:39267/file_sharing_angular';
var db;

//connect to database and run app
mongodb.MongoClient.connect(MONGO_URL, { useNewUrlParser: true }, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database.db('file_sharing_angular');
  console.log("Database connection ready");
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, function () {
    console.log('Node.js server is running on port ' + PORT);
  });
})


//local storage setup
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, DIR);
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
    }
});


let upload = multer({storage: storage});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
 
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
 
app.get('/api', function (req, res) {
  res.end('file catcher example');
});
 
app.post('/api/upload',upload.single('photo'), function (req, res) {
    if (!req.file) {
        console.log("No file received");
        return res.send({
          success: false
        });
    
      } else {
        console.log('file received');
        console.log(util.inspect(req.file, false, null, true))

        var params = {
          Bucket: 'file.storage.angular',
          Key: req.file.filename,
          Body: fs.createReadStream(req.file.path)
        }

        s3.upload(params, function (err, data) {
          //handle error
          if (err) {
            console.log("Error", err);
            return res.send({
              success: false
            });
          }

          //success
          if (data) {
            console.log("Uploaded in:", data.Location);
            return res.send({
              success: true
            })
          }
      });
    }
  });
