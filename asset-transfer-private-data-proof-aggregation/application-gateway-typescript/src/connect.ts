/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

// Path to org1 crypto materials.
const cryptoPathOrg1 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org1.example.com'
);

// Path to org1 user private key directory.
export const keyDirectoryPathOrg1 = path.resolve(
    cryptoPathOrg1,
    'users',
    'User1@org1.example.com',
    'msp',
    'keystore'
);

// Path to org1 user certificate.
export const certDirectoryPathOrg1 = path.resolve(
    cryptoPathOrg1,
    'users',
    'User1@org1.example.com',
    'msp',
    'signcerts'
);

// Path to org1 peer tls certificate.
export const tlsCertPathOrg1 = path.resolve(
    cryptoPathOrg1,
    'peers',
    'peer0.org1.example.com',
    'tls',
    'ca.crt'
);

// Path to org2 crypto materials.
export const cryptoPathOrg2 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org2.example.com'
);

// Path to org2 user private key directory.
export const keyDirectoryPathOrg2 = path.resolve(
    cryptoPathOrg2,
    'users',
    'User1@org2.example.com',
    'msp',
    'keystore'
);

// Path to org2 user certificate.
export const certDirectoryPathOrg2 = path.resolve(
    cryptoPathOrg2,
    'users',
    'User1@org2.example.com',
    'msp',
    'signcerts'
);

// Path to org2 peer tls certificate.
export const tlsCertPathOrg2 = path.resolve(
    cryptoPathOrg2,
    'peers',
    'peer0.org2.example.com',
    'tls',
    'ca.crt'
);

// Path to org3 crypto materials.
export const cryptoPathOrg3 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org3.example.com'
);

// Path to org3 user private key directory.
export const keyDirectoryPathOrg3 = path.resolve(
    cryptoPathOrg3,
    'users',
    'User1@org3.example.com',
    'msp',
    'keystore'
);

// Path to org3 user certificate.
export const certDirectoryPathOrg3 = path.resolve(
    cryptoPathOrg3,
    'users',
    'User1@org3.example.com',
    'msp',
    'signcerts'
);

// Path to org3 peer tls certificate.
export const tlsCertPathOrg3 = path.resolve(
    cryptoPathOrg3,
    'peers',
    'peer0.org3.example.com',
    'tls',
    'ca.crt'
);

// Path to org4 crypto materials.
export const cryptoPathOrg4 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org4.example.com'
);

// Path to org4 user private key directory.
export const keyDirectoryPathOrg4 = path.resolve(
    cryptoPathOrg4,
    'users',
    'User1@org4.example.com',
    'msp',
    'keystore'
);

// Path to org4 user certificate.
export const certDirectoryPathOrg4 = path.resolve(
    cryptoPathOrg4,
    'users',
    'User1@org4.example.com',
    'msp',
    'signcerts'
);

// Path to org4 peer tls certificate.
export const tlsCertPathOrg4 = path.resolve(
    cryptoPathOrg4,
    'peers',
    'peer0.org4.example.com',
    'tls',
    'ca.crt'
);

// Path to org5 crypto materials.
export const cryptoPathOrg5 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org5.example.com'
);

// Path to org5 user private key directory.
export const keyDirectoryPathOrg5 = path.resolve(
    cryptoPathOrg5,
    'users',
    'User1@org5.example.com',
    'msp',
    'keystore'
);

// Path to org5 user certificate.
export const certDirectoryPathOrg5 = path.resolve(
    cryptoPathOrg5,
    'users',
    'User1@org5.example.com',
    'msp',
    'signcerts'
);

// Path to org5 peer tls certificate.
export const tlsCertPathOrg5 = path.resolve(
    cryptoPathOrg5,
    'peers',
    'peer0.org5.example.com',
    'tls',
    'ca.crt'
);

// Path to org6 crypto materials.
export const cryptoPathOrg6 = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'modified-test-net',
    'organizations',
    'peerOrganizations',
    'org6.example.com'
);

// Path to org6 user private key directory.
export const keyDirectoryPathOrg6 = path.resolve(
    cryptoPathOrg6,
    'users',
    'User1@org6.example.com',
    'msp',
    'keystore'
);

// Path to org5 user certificate.
export const certDirectoryPathOrg6 = path.resolve(
    cryptoPathOrg6,
    'users',
    'User1@org6.example.com',
    'msp',
    'signcerts'
);

// Path to org6 peer tls certificate.
export const tlsCertPathOrg6 = path.resolve(
    cryptoPathOrg6,
    'peers',
    'peer0.org6.example.com',
    'tls',
    'ca.crt'
);

// Gateway peer endpoint.
export const peerEndpointOrg1 = 'localhost:7051';
export const peerEndpointOrg2 = 'localhost:9051';
export const peerEndpointOrg3 = 'localhost:11051';
export const peerEndpointOrg4 = 'localhost:13051';
export const peerEndpointOrg5 = 'localhost:15051';
export const peerEndpointOrg6 = 'localhost:16051';

// Gateway peer container name.
export const peerNameOrg1 = 'peer0.org1.example.com';
export const peerNameOrg2 = 'peer0.org2.example.com';
export const peerNameOrg3 = 'peer0.org3.example.com';
export const peerNameOrg4 = 'peer0.org4.example.com';
export const peerNameOrg5 = 'peer0.org5.example.com';
export const peerNameOrg6 = 'peer0.org6.example.com';


export async function newGrpcConnection(
    tlsCertPath: string,
    peerEndpoint: string,
    peerName: string
): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerName,
    });
}

export async function newIdentity(
    certDirectoryPath: string,
    mspId: string
): Promise<Identity> {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

export async function newSigner(keyDirectoryPath: string): Promise<Signer> {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}
