'use strict';

var mongoose = require('mongoose');
const User = mongoose.model('Users');
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var path = require('path');
var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var store_path = path.join(__dirname, 'hfc-key-store');
const CA_URL = 'https://localhost:7054';
const generateKey = require('./utils/crypto_utils').generateAESKey;
const encryptAES = require('./utils/crypto_utils').encryptAES;
const decryptAES = require('./utils/crypto_utils').decryptAES;
const encryptRSA = require('./utils/crypto_utils').encryptStringWithRsaPublicKey;
const decryptRSA = require('./utils/crypto_utils').decryptStringWithRsaPrivateKey;

exports.init = function(){
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        fabric_ca_client = new Fabric_CA_Client(CA_URL, null , '', crypto_suite);
    
        admin_user = fabric_client.getUserContext('admin', true)
        .then((user) => {
            admin_user = user;
        })
    });
}

exports.createUser = function(req, res) {
    var certificate;
    var key;
    console.log(req.body);
    return fabric_ca_client.register({enrollmentID: req.body.email, affiliation: 'org1.department1', role: 'user', enrollmentSecret: req.body.password}, admin_user)
    .then((secret) => {
        return fabric_ca_client.enroll({enrollmentID: req.body.email, enrollmentSecret: secret});
    }).then((enrollment) => {
        certificate = enrollment.certificate;
        key = enrollment.key.toBytes();
        return fabric_client.createUser(
            {username: req.body.email,
            mspid: 'Org1MSP',
            cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });
    }).then((user) => {
        var keyString = generateKey();
        var cryptedKey = encryptRSA(keyString, path.join(__dirname, './keys/public.pem'));
        var user = new User({
           email: req.body.email,
           password: encryptAES(req.body.password, key),
           name: req.body.name,
           cpf: req.body.cpf,
           key: cryptedKey
        });
        user.save(function(err, user) {
            if (err)
                res.send(err);
            res.status(201).json({
                key: key,
                certificate: certificate
            });
        });
    }).catch((err) => {
        res.status(500).json({
            message: "Error: " + err
        })
    });
};

exports.login = function(req, res){
    fabric_client.getUserContext(req.body.email, true)
    .then((user) => {
        if (user && user.isEnrolled()) {
            User.findOne({email: req.body.email}, function(err, response){
                if(err)
                    res.send(err);
                var key = decryptRSA(response.key, path.join(__dirname, './keys/private.pem'), 'senha');
                var password = decryptAES(response.password, key);
                if(password == req.body.password){
                    res.status(200).json({
                        message: 'Login successful!'
                    });
                } else{
                    res.status(400).json({
                        message: 'Invalid credentials!'
                    });
                }
            });
        }
    }).catch((error) => {
        res.status(500).json({
            message: "Error: " + error
        })
    })
}