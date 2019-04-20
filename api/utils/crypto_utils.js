var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
var randomString = require("randomstring");

const key = process.env.ENCRYPTION_KEY || "secret";
const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes256';
const inputEncoding = process.env.ENCRYPTION_INPUT_ENCODING || 'utf8';
const outputEncoding = process.env.ENCRYPTION_OUTPUT_ENCODING || 'hex';
const IV_LENGTH = 16;

var generateAESKey = function(){
    return randomString.generate();
}

var encryptAES = function(value, useKey = key) {
    let iv = crypto.randomBytes(IV_LENGTH);
    var cipher = crypto.createCipheriv(algorithm, Buffer.from(useKey), iv);
    var encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

var decryptAES = function(encrypted, useKey = key) {
    let textParts = encrypted.split(':');
	let iv = Buffer.from(textParts.shift(), 'hex');
	let encryptedText = Buffer.from(textParts.join(':'), 'hex');
	let decipher = crypto.createDecipheriv(algorithm, Buffer.from(useKey), iv);
	let decrypted = decipher.update(encryptedText);

	decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

var encryptStringWithRsaPublicKey = function(toEncrypt, pathPublicKey) {
    var absolutePath = path.resolve(pathPublicKey);
    var publicKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toEncrypt, 'utf8');
    var encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString("base64");
};

var decryptStringWithRsaPrivateKey = function(toDecrypt, relativeOrAbsolutePathtoPrivateKey, senha) {
    var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
    var privateKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toDecrypt, "base64");
    var decrypted = crypto.privateDecrypt(
    {
        key: privateKey.toString(),
        passphrase: senha
    }, buffer);
    return decrypted.toString("utf8");
};

module.exports = {
    encryptStringWithRsaPublicKey: encryptStringWithRsaPublicKey,
    decryptStringWithRsaPrivateKey: decryptStringWithRsaPrivateKey,
    encryptAES: encryptAES,
    decryptAES: decryptAES,
    generateAESKey: generateAESKey
}