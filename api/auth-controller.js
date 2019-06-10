'use strict';

var mongoose = require('mongoose');
const User = mongoose.model('Users');
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const pathLib = require('path');
const generateKey = require('./utils/crypto_utils').generateAESKey;
const encryptAES = require('./utils/crypto_utils').encryptAES;
const decryptAES = require('./utils/crypto_utils').decryptAES;
const encryptRSA = require('./utils/crypto_utils').encryptStringWithRsaPublicKey;
const decryptRSA = require('./utils/crypto_utils').decryptStringWithRsaPrivateKey;

var fabric_client = new Fabric_Client();
var store_path = pathLib.join(__dirname, 'hfc-key-store');
const CA_URL = 'https://35.199.126.237/:7054';
const wallet = new FileSystemWallet(pathLib.join(__dirname, '/wallet'));
var ca;
var adminIdentity;

exports.init = async function(){   
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        ca = new Fabric_CA_Client(CA_URL);
        fabric_client.getUserContext('admin', true)
        .then((user) => {
            adminIdentity = user;
        })
    });
}

exports.createUser = function(req, res) {
    var certificate;
    var key;
    return ca.register({enrollmentID: req.body.email, affiliation: 'org1.department1', role: 'client', enrollmentSecret: req.body.password}, adminIdentity)
    .then((secret) => {
        return ca.enroll({enrollmentID: req.body.email, enrollmentSecret: secret});
    }).then((enrollment) => {
        certificate = enrollment.certificate;
        key = enrollment.key.toBytes();
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        return wallet.import(req.body.email, userIdentity);
    }).then(() => {
        var keyString = generateKey();
        var cryptedKey = encryptRSA(keyString, pathLib.join(__dirname, './keys/public.pem'));
        var user = new User({
           email: req.body.email,
           password: encryptAES(req.body.password, keyString),
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
        console.log(err);
        res.status(500).json({
            message: "Error: " + err
        })
    });
};

exports.login = function(req, res){
    wallet.exists(req.body.email)
    .then((exist) => {
        if (exist) {
            User.findOne({email: req.body.email}, function(err, response){
                if(err)
                    res.send(err);
                var key = decryptRSA(response.key, pathLib.join(__dirname, './keys/private.pem'), 'senha');
                var password = decryptAES(response.password, key);
                if(password == req.body.password){
                    res.status(200).json({
                        email: response.email,
                        cpf: response.cpf,
                        name: response.name
                    });
                } else{
                    res.status(400).json({
                        message: 'Invalid credentials!'
                    });
                }
            });
        } else{
            res.status(400).json({
                message: 'Invalid credentials!'
            });
        }
    }).catch((error) => {
        console.log(error);
        res.status(500).json({
            message: "Error: " + error
        })
    })
}
