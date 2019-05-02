/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ccpPath = path.join(__dirname, '/api/prontuchain-connection/config.yaml');
const ccpJSON = yaml.safeLoad(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
    try {

        // Create a new CA client for interacting with the CA.
        //const caURL = ccp.certificateAuthorities['ca.example.com'].url;
        const ca = new FabricCAServices('http://localhost:7054');

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, '/api/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import('admin', identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();
