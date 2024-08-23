/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { connect, Contract } from '@hyperledger/fabric-gateway';
import { TextDecoder } from 'util';
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';

import {
    certDirectoryPathOrg1, certDirectoryPathOrg2, /*certDirectoryPathOrg3,*/ keyDirectoryPathOrg1, keyDirectoryPathOrg2, /*keyDirectoryPathOrg3,*/ newGrpcConnection, newIdentity,
    newSigner, peerEndpointOrg1, peerEndpointOrg2, /*peerEndpointOrg3,*/ peerNameOrg1, peerNameOrg2, /*peerNameOrg3,*/ tlsCertPathOrg1, tlsCertPathOrg2, /*tlsCertPathOrg3*/
} from './connect';

// Paths to necessary files for zkp
const circuitWasmPath: string = './zkp_files/circuit_js/circuit.wasm';
const zkeyPath: string = './zkp_files/circuit_final.zkey';
const vkeyPath: string = './zkp_files/verification_key.json';

const channelName1 = 'channel1';
// const channelName2 = 'channel2';
const chaincodeName = 'private';
const mspIdOrg1 = 'Org1MSP';
const mspIdOrg2 = 'Org2MSP';
// const mspIdOrg3 = 'Org3MSP';

const utf8Decoder = new TextDecoder();

// Collection Names
const org1PrivateCollectionName = 'Org1MSPPrivateCollection';
const org2PrivateCollectionName = 'Org2MSPPrivateCollection';
// const org3PrivateCollectionName = 'Org3MSPPrivateCollection';

const RED = '\x1b[31m\n';
const RESET = '\x1b[0m';

// Use a unique key so that we can run multiple times
const now = Date.now();
const assetID1 = `asset${String(now)}`;
// const assetID2 = `asset${String(now + 1)}`;

type Asset = [string, string, number, number];

const assets: Asset[] = [
  [assetID1, 'green', 20, 100],
//   [assetID2, 'red', 50, 727],
];
let counter = 0;

async function main(): Promise<void> {
    const clientOrg1 = await newGrpcConnection(
        tlsCertPathOrg1,
        peerEndpointOrg1,
        peerNameOrg1
    );

    const gatewayOrg1 = connect({
        client: clientOrg1,
        identity: await newIdentity(certDirectoryPathOrg1, mspIdOrg1),
        signer: await newSigner(keyDirectoryPathOrg1),
    });

    const clientOrg2 = await newGrpcConnection(
        tlsCertPathOrg2,
        peerEndpointOrg2,
        peerNameOrg2
    );

    const gatewayOrg2 = connect({
        client: clientOrg2,
        identity: await newIdentity(certDirectoryPathOrg2, mspIdOrg2),
        signer: await newSigner(keyDirectoryPathOrg2),
    });

    // const clientOrg3 = await newGrpcConnection(
    //     tlsCertPathOrg3,
    //     peerEndpointOrg3,
    //     peerNameOrg3
    // );

    // const gatewayOrg3 = connect({
    //     client: clientOrg3,
    //     identity: await newIdentity(certDirectoryPathOrg3, mspIdOrg3),
    //     signer: await newSigner(keyDirectoryPathOrg3),
    // });

    try {
        // Get the smart contract as an Org1 client.
        const contractOrg1 = gatewayOrg1
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org2 client.
        const contractOrg2 = gatewayOrg2
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org1 client.
        // const contractOrg1_2 = gatewayOrg1
        //     .getNetwork(channelName2)
        //     .getContract(chaincodeName);

        // Get the smart contract as an Org3 client.
        // const contractOrg3 = gatewayOrg3
        //     .getNetwork(channelName2)
        //     .getContract(chaincodeName);

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

        // Create new assets on the ledger.
        await createAssets(contractOrg1);

        await readAssetByID(contractOrg1, assetID1);

        // Read asset from the Org1's private data collection with ID in the given range.
        await readAssetPrivateDetails(contractOrg1, assetID1, org1PrivateCollectionName);

        // Create new assets on the ledger.
        // await createAssets(contractOrg1_2);

        // Read asset from the Org1's private data collection with ID in the given range.
        // await getAssetsByRange(contractOrg1_2);
        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Make agreement to transfer the asset from Org1 to Org2.
        await sendassetquery(contractOrg2, assetID1);

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

        // Read transfer agreement.
        const requester_quantity = await readassetquery(contractOrg1, assetID1);
        console.log('\n***Hello!!!\n');
        // Input JSON
        const input = {
            a: requester_quantity.toString(),
            b: assets[0]![3].toString()
        };

        // Run the proof generation and verification
        console.log('\n***Hello!!!\n');
        await generateProof(input);
        console.log('\n***Hello!!!\n');

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Read the asset by ID.
        await readAssetByID(contractOrg2, assetID1);

        // Attempt to read private details of asset1 but should fail
        await readAssetPrivateDetails(contractOrg2, assetID1, org2PrivateCollectionName);

        // Make agreement to transfer the asset from Org1 to Org2.
        await agreeToTransfer(contractOrg2, assetID1);

        await readAssetPrivateDetails(contractOrg2, assetID1, org2PrivateCollectionName);

        // console.log('\n~~~~~~~~~~~~~~~~ As Org3 Client ~~~~~~~~~~~~~~~~');

        // Read the asset by ID.
        // await readAssetByID(contractOrg3, assetID2);

        // Make agreement to transfer the asset from Org1 to Org2.
        // await agreeToTransfer(contractOrg3, assetID2);

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

        // Read transfer agreement.
        await readTransferAgreement(contractOrg1, assetID1);

        // Read transfer agreement.
        // await readTransferAgreement(contractOrg1_2, assetID2);

        // Transfer asset to Org2.
        await transferAsset(contractOrg1, assetID1);

        // Transfer asset to Org3.
        // await transferAsset(contractOrg1_2, assetID2);

        // Again ReadAsset : results will show that the buyer identity now owns the asset.
        await readAssetByID(contractOrg1, assetID1);

        // Again ReadAsset : results will show that the buyer identity now owns the asset.
        // await readAssetByID(contractOrg1_2, assetID2);

        // Confirm that transfer removed the private details from the Org1 collection.
        const org1ReadSuccess = await readAssetPrivateDetails(contractOrg1, assetID1, org1PrivateCollectionName);
        if (org1ReadSuccess) {
            doFail(`Asset private data still exists in ${org1PrivateCollectionName}`);
        }

        // Confirm that transfer removed the private details from the Org1 collection.
        // const org1ReadSuccess_2 = await readAssetPrivateDetails(contractOrg1_2, assetID2, org1PrivateCollectionName);
        // if (org1ReadSuccess_2) {
        //     doFail(`Asset private data still exists in ${org1PrivateCollectionName}`);
        // }

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Org2 can read asset private details: Org2 is owner, and private details exist in new owner's Collection
        const org2ReadSuccess = await readAssetPrivateDetails(contractOrg2, assetID1, org2PrivateCollectionName);
        if (!org2ReadSuccess) {
            doFail(`Asset private data not found in ${org2PrivateCollectionName}`);
        }

        // console.log('\n~~~~~~~~~~~~~~~~ As Org3 Client ~~~~~~~~~~~~~~~~');

        // Org2 can read asset private details: Org2 is owner, and private details exist in new owner's Collection
        // const org3ReadSuccess = await readAssetPrivateDetails(contractOrg3, assetID2, org3PrivateCollectionName);
        // if (!org3ReadSuccess) {
        //     doFail(`Asset private data not found in ${org3PrivateCollectionName}`);
        // }
        
        await purgeAsset(contractOrg1, assetID1);
        await purgeAsset(contractOrg2, assetID1);
    } finally {
        gatewayOrg1.close();
        clientOrg1.close();

        gatewayOrg2.close();
        clientOrg2.close();
    }
}

main().catch((error: unknown) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAssets(contract: Contract): Promise<void> {
    const assetType = 'ValuableAsset';

    console.log(`\n--> Submit Transaction: CreateAsset, ID: ${assets[counter]![0]}`);

    const asset1Data = {
        objectType: assetType,
        assetID: assets[counter]![0],
        color: assets[counter]![1],
        size: assets[counter]![2],
        quantityValue: assets[counter]![3],
    };

    await contract.submit('CreateAsset', {
        transientData: { asset_properties: JSON.stringify(asset1Data) },
    });

    console.log('*** Transaction committed successfully');

    counter++;
}

// async function getAssetsByRange(contract: Contract): Promise<void> {
//     // GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive).
//     console.log(`\n--> Evaluate Transaction: ReadAssetPrivateDetails from ${org1PrivateCollectionName}`);

//     const resultBytes = await contract.evaluateTransaction(
//         'GetAssetByRange',
//         assetID1,
//         `asset${String(now + 2)}`
//     );

//     const resultString = utf8Decoder.decode(resultBytes);
//     if (!resultString) {
//         doFail('Received empty query list for readAssetPrivateDetailsOrg1');
//     }
//     const result: unknown = JSON.parse(resultString);
//     console.log('*** Result:', result);
// }

async function readAssetByID(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Evaluate Transaction: ReadAsset, ID: ${assetID}`);
    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetID);

    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received empty result for ReadAsset');
    }
    const result: unknown = JSON.parse(resultString);
    console.log('*** Result:', result);
}

async function sendassetquery(contract: Contract, assetID: string): Promise<void> {
    // Buyer from Org2 sends a query to the seller regarding an asset with an appraised value
    const quantityValue = 99;
    const assetQueryData = { assetID, quantityValue };
    console.log('\n--> Submit Transaction: SendAssetQuery, payload:', assetQueryData);

    await contract.submitTransaction('SendAssetQuery', assetID, quantityValue.toString());

    console.log('*** Transaction committed successfully');
}

async function agreeToTransfer(contract: Contract, assetID: string): Promise<void> {
    // Buyer from Org2 agrees to buy the asset//
    // To purchase the asset, the buyer needs to agree to the same value as the asset owner

    const dataForAgreement = { assetID, quantityValue: 99};
    console.log('\n--> Submit Transaction: AgreeToTransfer, payload:', dataForAgreement);

    await contract.submit('AgreeToTransfer', {
        transientData: { asset_value: JSON.stringify(dataForAgreement) },
    });

    console.log('*** Transaction committed successfully');
}

async function readassetquery(contract: Contract, assetID: string): Promise<number> {
    // Seller retrieves the query sent by a buyer

    console.log('\n--> Submit Transaction: ReadAssetQuery, assetID:', assetID);

    const resultBytes = await contract.evaluateTransaction('ReadAssetQuery', assetID);
    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received no result for ReadTransferAgreement');
    }
    const result = JSON.parse(resultString);
    console.log('*** Result:', result);
    return result.quantityValue;
}

async function readTransferAgreement(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Evaluate Transaction: ReadTransferAgreement, ID: ${assetID}`);

    const resultBytes = await contract.evaluateTransaction(
        'ReadTransferAgreement',
        assetID
    );

    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received no result for ReadTransferAgreement');
    }
    const result: unknown = JSON.parse(resultString);
    console.log('*** Result:', result);
}

async function transferAsset(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Submit Transaction: TransferAsset, ID: ${assetID}`);

    const buyerDetails = { assetID, buyerMSP: mspIdOrg2 };
    await contract.submit('TransferAsset', {
        transientData: { asset_owner: JSON.stringify(buyerDetails) },
    });

    console.log('*** Transaction committed successfully');
}

// async function deleteAsset(contract: Contract, assetID: string): Promise<void> {
//     console.log('\n--> Submit Transaction: DeleteAsset, ID:', assetID);
//     const dataForDelete = { assetID };
//     await contract.submit('DeleteAsset', {
//         transientData: { asset_delete: JSON.stringify(dataForDelete) },
//     });

//     console.log('*** Transaction committed successfully');
// }

async function purgeAsset(contract: Contract, assetID: string): Promise<void> {
    console.log('\n--> Submit Transaction: PurgeAsset, ID:', assetID);
    const dataForPurge = { assetID };
    await contract.submit('PurgeAsset', {
        transientData: { asset_purge: JSON.stringify(dataForPurge) },
    });

    console.log('*** Transaction committed successfully');
}

async function readAssetPrivateDetails(contract: Contract, assetID: string, collectionName: string): Promise<boolean> {
    console.log(`\n--> Evaluate Transaction: ReadAssetPrivateDetails from ${collectionName}, ID: ${assetID}`);

    const resultBytes = await contract.evaluateTransaction(
        'ReadAssetPrivateDetails',
        collectionName,
        assetID
    );

    const resultJson = utf8Decoder.decode(resultBytes);
    if (!resultJson) {
        console.log('*** No result');
        return false;
    }
    const result: unknown = JSON.parse(resultJson);
    console.log('*** Result:', result);
    return true;
}

export function doFail(msgString: string): never {
    console.error(`${RED}\t${msgString}${RESET}`);
    throw new Error(msgString);
}

async function generateProof(input: { a: string; b: string }): Promise<void> {
    try {
        // Load the WASM file and zkey file
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input, 
            circuitWasmPath, 
            zkeyPath
        );

        // Write the proof and public signals to files
        fs.writeFileSync('zkp_files/proof.json', JSON.stringify(proof));
        fs.writeFileSync('zkp_files/public.json', JSON.stringify(publicSignals));

        console.log("Proof generated successfully!");

        // Verify the proof
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        if (isValid && publicSignals[0] === "1") {  // Assuming `oldEnough` is the first public signal
            console.log("Proof is valid!");
        } else {
            console.log("Proof is invalid!");
        }
    } catch (err) {
        console.error("Failed to generate proof:", err);
    }
}