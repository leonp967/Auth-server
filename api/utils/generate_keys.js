const { generateKeyPair } = require('crypto');
var fs = require('fs');
generateKeyPair('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'senha'
  }
}, (err, publicKey, privateKey) => {
    fs.writeFile("./public.pem", publicKey, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });
    fs.writeFile("./private.pem", privateKey, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });
});