/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { connect, Contract } from '@hyperledger/fabric-gateway';
import { TextDecoder } from 'util';
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import WebSocket from 'ws';

import {
    certDirectoryPathOrg1, certDirectoryPathOrg2, certDirectoryPathOrg3, certDirectoryPathOrg4, 
    certDirectoryPathOrg5, certDirectoryPathOrg6, keyDirectoryPathOrg1, keyDirectoryPathOrg2, 
    keyDirectoryPathOrg3, keyDirectoryPathOrg4, keyDirectoryPathOrg5, keyDirectoryPathOrg6,
    newGrpcConnection, newIdentity, newSigner, peerEndpointOrg1, peerEndpointOrg2, peerEndpointOrg3, 
    peerEndpointOrg4, peerEndpointOrg5, peerEndpointOrg6, peerNameOrg1, peerNameOrg2, peerNameOrg3, 
    peerNameOrg4, peerNameOrg5, peerNameOrg6, tlsCertPathOrg1, tlsCertPathOrg2, tlsCertPathOrg3,
    tlsCertPathOrg4, tlsCertPathOrg5, tlsCertPathOrg6
} from './connect';

// Paths to necessary files for zkp
const circuitWasmPath: string = './zkp_files/circuit_js/circuit.wasm';
const zkeyPath: string = './zkp_files/circuit_final.zkey';
const vkeyPath: string = './zkp_files/verification_key.json';

const channelName1 = 'channel1';
const chaincodeName = 'private';
const mspIdOrg1 = 'Org1MSP';
const mspIdOrg2 = 'Org2MSP';
const mspIdOrg3 = 'Org3MSP';
const mspIdOrg4 = 'Org4MSP';
const mspIdOrg5 = 'Org5MSP';
const mspIdOrg6 = 'Org6MSP';
const total_orgs = 6;
let proof_info_string: string = "Nothing";
let proof_results: string = "Nothing";

const utf8Decoder = new TextDecoder();

// Collection Names
const org1PrivateCollectionName = 'Org1MSPPrivateCollection';
const org2PrivateCollectionName = 'Org2MSPPrivateCollection';
const org3PrivateCollectionName = 'Org3MSPPrivateCollection';
const org4PrivateCollectionName = 'Org4MSPPrivateCollection';
const org5PrivateCollectionName = 'Org5MSPPrivateCollection';
const org6PrivateCollectionName = 'Org6MSPPrivateCollection';

const RED = '\x1b[31m\n';
const RESET = '\x1b[0m';

// Use a unique key so that we can run multiple times
const now = Date.now();
const assetID1 = `asset${String(now)}`;

type Asset = [string, string, number, number];

const assets: Asset[] = [
  [assetID1, 'green', 20, 100],
];
let counter = 0;
const QuantityValueRequested = 20;
let orgs_satisfy_set: string[] = [];
let orgs_error_set: string[] = [];

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

    const clientOrg3 = await newGrpcConnection(
        tlsCertPathOrg3,
        peerEndpointOrg3,
        peerNameOrg3
    );

    const gatewayOrg3 = connect({
        client: clientOrg3,
        identity: await newIdentity(certDirectoryPathOrg3, mspIdOrg3),
        signer: await newSigner(keyDirectoryPathOrg3),
    });

    const clientOrg4 = await newGrpcConnection(
        tlsCertPathOrg4,
        peerEndpointOrg4,
        peerNameOrg4
    );

    const gatewayOrg4 = connect({
        client: clientOrg4,
        identity: await newIdentity(certDirectoryPathOrg4, mspIdOrg4),
        signer: await newSigner(keyDirectoryPathOrg4),
    });

    const clientOrg5 = await newGrpcConnection(
        tlsCertPathOrg5,
        peerEndpointOrg5,
        peerNameOrg5
    );

    const gatewayOrg5 = connect({
        client: clientOrg5,
        identity: await newIdentity(certDirectoryPathOrg5, mspIdOrg5),
        signer: await newSigner(keyDirectoryPathOrg5),
    });

    const clientOrg6 = await newGrpcConnection(
        tlsCertPathOrg6,
        peerEndpointOrg6,
        peerNameOrg6
    );

    const gatewayOrg6 = connect({
        client: clientOrg6,
        identity: await newIdentity(certDirectoryPathOrg6, mspIdOrg6),
        signer: await newSigner(keyDirectoryPathOrg6),
    });

    try {
        // Get the smart contract as an Org1 client.
        const contractOrg1 = gatewayOrg1
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org2 client.
        const contractOrg2 = gatewayOrg2
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org3 client.
        const contractOrg3 = gatewayOrg3
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org3 client.
        const contractOrg4 = gatewayOrg4
            .getNetwork(channelName1)
            .getContract(chaincodeName);
        
        // Get the smart contract as an Org3 client.
        const contractOrg5 = gatewayOrg5
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        // Get the smart contract as an Org3 client.
        const contractOrg6 = gatewayOrg6
            .getNetwork(channelName1)
            .getContract(chaincodeName);

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');
        // Create new assets on the ledger.
        await createAssets(contractOrg1, 'org1' + assetID1);

        await readAssetByID(contractOrg1, 'org1' + assetID1);

        await readAssetByID(contractOrg2, 'org1' + assetID1);

        await readAssetByID(contractOrg3, 'org1' + assetID1);

        await readAssetByID(contractOrg4, 'org1' + assetID1);

        await readAssetByID(contractOrg5, 'org1' + assetID1);
        
        await readAssetByID(contractOrg6, 'org1' + assetID1);

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Make Query to transfer the asset from Org1 to Org2.
        await sendassetquery(contractOrg2, assetID1, 'org2');

        console.log('\n~~~~~~~~~~~~~~~~ As Org3 Client ~~~~~~~~~~~~~~~~');

        // Make Query to transfer the asset from Org1 to Org3.
        await sendassetquery(contractOrg3, assetID1, 'org3');

        console.log('\n~~~~~~~~~~~~~~~~ As Org4 Client ~~~~~~~~~~~~~~~~');

        // Make Query to transfer the asset from Org1 to Org3.
        await sendassetquery(contractOrg4, assetID1, 'org4');
        
        console.log('\n~~~~~~~~~~~~~~~~ As Org5 Client ~~~~~~~~~~~~~~~~');

        // Make Query to transfer the asset from Org1 to Org3.
        await sendassetquery(contractOrg5, assetID1, 'org5');

        console.log('\n~~~~~~~~~~~~~~~~ As Org6 Client ~~~~~~~~~~~~~~~~');

        // Make Query to transfer the asset from Org1 to Org6.
        await sendassetquery(contractOrg6, assetID1, 'org6');

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');
        // // Read transfer agreement.
        const total_requester_quantity = await readassetquery(contractOrg1, assetID1, 'org1', org1PrivateCollectionName);
        console.log("\nTotal Request Value: ", total_requester_quantity);
        console.log("\nSet of Nodes to satisfy: ", orgs_satisfy_set)
        console.log("\nSet of Nodes to Deny: ", orgs_error_set)

        // Input JSON
        const input = {
            a: assets[0]![3].toString(),
            b: total_requester_quantity.toString()
        };
        await createServer(contractOrg2, assetID1);
        console.log("\nSleeping to Open Reciever Socket...");
        await sleep(2000);

        // Run the proof generation and verification
        await generateproof_send(contractOrg1, assetID1, input, 'org2').catch(console.error);
        console.log("\nSleeping to Open Sender Socket...");
        await sleep(2000);

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        proof_results = await readasset_verifyproof(contractOrg2, 'org1' + assetID1, proof_info_string);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
        //     // Make agreement to transfer the asset from Org1 to Org2.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg2, 'org1' + assetID1);

            await readAssetPrivateDetails(contractOrg2, 'org2' + assetID1, org2PrivateCollectionName);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            // // // Transfer asset to Org2.
            await transferAsset(contractOrg1, 'org1' + assetID1, QuantityValueRequested);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

            // Org1 can read asset private details: Org1 is owner, and private details exist in new owner's Collection
            const org1ReadSuccess = await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            if (!org1ReadSuccess) {
                doFail(`Asset private data not found in ${org1PrivateCollectionName}`);
            }

            // Org2 can read asset private details: Org2 is owner, and private details exist in new owner's Collection
            const org2ReadSuccess = await readAssetPrivateDetails(contractOrg2, 'org2' + assetID1, org2PrivateCollectionName);
            if (!org2ReadSuccess) {
                doFail(`Asset private data not found in ${org2PrivateCollectionName}`);
            }
        }
        else {
            console.log("\nFailed to Verify Asset");
        }

        // Run the proof generation or read 
        await generateproof_send(contractOrg1, assetID1, input, 'org3').catch(console.error);
        console.log("\nSleeping to Open Sender Socket...");
        await sleep(2000);

        console.log('\n~~~~~~~~~~~~~~~~ As Org3 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        proof_results = await readasset_verifyproof(contractOrg3, 'org1' + assetID1, proof_info_string);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
            // Make agreement to transfer the asset from Org1 to Org2.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg3, 'org1' + assetID1);
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            await readAssetPrivateDetails(contractOrg3, 'org3' + assetID1, org3PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            await readAssetByID(contractOrg1, 'org1' + assetID1);

            // // Transfer asset to Org2.
            await transferAsset(contractOrg1, 'org1' + assetID1, QuantityValueRequested);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org2' + assetID1);
            await readAssetByID(contractOrg1, 'org3' + assetID1);

            console.log('\n~~~~~~~~~~~~~~~~ As Org3 Client ~~~~~~~~~~~~~~~~');

            // Org3 can read asset private details: Org3 is owner, and private details exist in new owner's Collection
            const org3ReadSuccess = await readAssetPrivateDetails(contractOrg3, 'org3' + assetID1, org3PrivateCollectionName);
            if (!org3ReadSuccess) {
                doFail(`Asset private data not found in ${org3PrivateCollectionName}`);
            }
        }
        else {
            console.log("\nFailed to Verify Asset");
        }

        // Run the proof generation or read 
        await generateproof_send(contractOrg1, assetID1, input, 'org4').catch(console.error);
        console.log("\nSleeping to Open Sender Socket...");
        await sleep(2000);

        console.log('\n~~~~~~~~~~~~~~~~ As Org4 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        proof_results = await readasset_verifyproof(contractOrg4, 'org1' + assetID1, proof_info_string);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
            // Make agreement to transfer the asset from Org1 to Org2.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg4, 'org1' + assetID1);
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            await readAssetPrivateDetails(contractOrg4, 'org4' + assetID1, org4PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            await readAssetByID(contractOrg1, 'org1' + assetID1);

            // // Transfer asset to Org2.
            await transferAsset(contractOrg1, 'org1' + assetID1, QuantityValueRequested);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org2' + assetID1);
            await readAssetByID(contractOrg1, 'org3' + assetID1);
            await readAssetByID(contractOrg1, 'org4' + assetID1);

            console.log('\n~~~~~~~~~~~~~~~~ As Org4 Client ~~~~~~~~~~~~~~~~');

            // Org4 can read asset private details: Org4 is owner, and private details exist in new owner's Collection
            const org4ReadSuccess = await readAssetPrivateDetails(contractOrg4, 'org4' + assetID1, org4PrivateCollectionName);
            if (!org4ReadSuccess) {
                doFail(`Asset private data not found in ${org4PrivateCollectionName}`);
            }
        }
        else {
            console.log("\nFailed to Verify Asset");
        }

        // Run the proof generation or read 
        await generateproof_send(contractOrg1, assetID1, input, 'org5').catch(console.error);
        console.log("\nSleeping to Open Sender Socket...");
        await sleep(2000);

        console.log('\n~~~~~~~~~~~~~~~~ As Org5 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        proof_results = await readasset_verifyproof(contractOrg5, 'org1' + assetID1, proof_info_string);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
            // Make agreement to transfer the asset from Org1 to Org2.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg5, 'org1' + assetID1);
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            await readAssetPrivateDetails(contractOrg5, 'org5' + assetID1, org5PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            await readAssetByID(contractOrg1, 'org1' + assetID1);

            // // Transfer asset to Org5.
            await transferAsset(contractOrg1, 'org1' + assetID1, QuantityValueRequested);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org2' + assetID1);
            await readAssetByID(contractOrg1, 'org3' + assetID1);
            await readAssetByID(contractOrg1, 'org4' + assetID1);
            await readAssetByID(contractOrg1, 'org5' + assetID1);

            console.log('\n~~~~~~~~~~~~~~~~ As Org4 Client ~~~~~~~~~~~~~~~~');

            // Org5 can read asset private details: Org5 is owner, and private details exist in new owner's Collection
            const org5ReadSuccess = await readAssetPrivateDetails(contractOrg5, 'org5' + assetID1, org5PrivateCollectionName);
            if (!org5ReadSuccess) {
                doFail(`Asset private data not found in ${org5PrivateCollectionName}`);
            }
        }
        else {
            console.log("\nFailed to Verify Asset");
        }

        // Run the proof generation or read 
        await generateproof_send(contractOrg1, assetID1, input, 'org6').catch(console.error);
        console.log("\nSleeping to Open Sender Socket...");
        await sleep(2000);

        console.log('\n~~~~~~~~~~~~~~~~ As Org6 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        proof_results = await readasset_verifyproof(contractOrg6, 'org1' + assetID1, proof_info_string);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
            // Make agreement to transfer the asset from Org1 to Org6.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg6, 'org1' + assetID1);
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            await readAssetPrivateDetails(contractOrg6, 'org6' + assetID1, org6PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            await readAssetByID(contractOrg1, 'org1' + assetID1);

            // // Transfer asset to Org6.
            await transferAsset(contractOrg1, 'org1' + assetID1, QuantityValueRequested);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org2' + assetID1);
            await readAssetByID(contractOrg1, 'org3' + assetID1);
            await readAssetByID(contractOrg1, 'org4' + assetID1);
            await readAssetByID(contractOrg1, 'org5' + assetID1);
            await readAssetByID(contractOrg1, 'org6' + assetID1);

            console.log('\n~~~~~~~~~~~~~~~~ As Org6 Client ~~~~~~~~~~~~~~~~');

            // Org6 can read asset private details: Org6 is owner, and private details exist in new owner's Collection
            const org6ReadSuccess = await readAssetPrivateDetails(contractOrg6, 'org6' + assetID1, org6PrivateCollectionName);
            if (!org6ReadSuccess) {
                doFail(`Asset private data not found in ${org6PrivateCollectionName}`);
            }
        }
        else {
            console.log("\nFailed to Verify Asset");
        }

        await purgeAsset(contractOrg1, 'org1' + assetID1);
        await purgeAsset(contractOrg2, 'org2' + assetID1);
        await purgeAsset(contractOrg3, 'org3' + assetID1);
        await purgeAsset(contractOrg4, 'org4' + assetID1);
        await purgeAsset(contractOrg5, 'org5' + assetID1);
        await purgeAsset(contractOrg6, 'org6' + assetID1);
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
async function createAssets(contract: Contract, assetID: string): Promise<void> {
    const assetType = 'ValuableAsset';

    console.log(`\n--> Submit Transaction: CreateAsset, ID: ${assets[counter]![0]}`);

    const asset1Data = {
        objectType: assetType,
        assetID: assetID,
        color: assets[counter]![1],
        size: assets[counter]![2],
        quantityvalue: assets[counter]![3],
    };

    await contract.submit('CreateAsset', {
        transientData: { asset_properties: JSON.stringify(asset1Data) },
    });

    console.log('*** Transaction committed successfully');

    counter++;
}

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

async function sendassetquery(contract: Contract, assetID: string, sender_org: string): Promise<void> {
    // Buyer from Org2 sends a query to the seller regarding an asset with an appraised value
    const quantityvalue = QuantityValueRequested;
    const assetQueryData = { assetID, quantityvalue };
    console.log('\n--> Submit Transaction: SendAssetQuery, payload:', assetQueryData);

    await contract.submitTransaction('SendAssetQuery', assetID, quantityvalue.toString(), sender_org);

    console.log('*** Transaction committed successfully');
}

async function agreeToTransfer(contract: Contract, assetID: string): Promise<void> {
    // Buyer from Org2 agrees to buy the asset//
    // To purchase the asset, the buyer needs to agree to the same value as the asset owner
    const dataForAgreement = { assetID, quantityvalue: QuantityValueRequested};
    console.log('\n--> Submit Transaction: AgreeToTransfer, payload:', dataForAgreement);

    await contract.submit('AgreeToTransfer', {
        transientData: { asset_value: JSON.stringify(dataForAgreement) },
    });
    console.log('*** Transaction committed successfully');
}

async function readassetquery(contract: Contract, assetID: string, owning_org: string, CollectionName: string): Promise<number> {
    const asset_quantity = await readAssetPrivateDetails(contract, owning_org + assetID, CollectionName)

    let totalQuantityValue = 0;
    await sleep(5000);
    for (let org = 2; org <= total_orgs; org++) {
        console.log(`\n--> Submit Transaction: ReadAssetQuery for org${org}, assetID: ${assetID}`);

        try {
            const resultBytes = await contract.evaluateTransaction('ReadAssetQuery', assetID, 'org'+org.toString());
            const resultString = utf8Decoder.decode(resultBytes);
            if (!resultString) {
                console.error(`Received no result for ReadAssetQuery from org${org}`);
                continue;
            }
            const result = JSON.parse(resultString);
            console.log(`*** Result from org${org}:`, result);

            // Accumulate the quantity value
            if (totalQuantityValue + result.quantityvalue > asset_quantity) {
                console.error(`Can not satisfy request of ${result.quantityvalue.toString()} from org${org}`);
                orgs_error_set.push(`org${org}`);
                continue;
            }
            totalQuantityValue += result.quantityvalue;
            orgs_satisfy_set.push(`org${org}`);
        } catch (error) {
            console.error(`Error querying for ${assetID}:`, `No query from org${org}, ignoring`);
        }
    }

    return totalQuantityValue;
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

async function transferAsset(contract: Contract, assetID: string, buyer_quantity_value: number): Promise<void> {
    console.log(`\n--> Submit Transaction: TransferAsset, ID: ${assetID}`);

    const buyerDetails = { assetID, buyerMSP: mspIdOrg2, buyer_quantity_value: buyer_quantity_value };
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

async function readAssetPrivateDetails(contract: Contract, assetID: string, collectionName: string): Promise<number> {
    console.log(`\n--> Evaluate Transaction: ReadAssetPrivateDetails from ${collectionName}, ID: ${assetID}`);

    try {
        const resultBytes = await contract.evaluateTransaction(
            'ReadAssetPrivateDetails',
            collectionName,
            assetID
        );

        const resultJson = utf8Decoder.decode(resultBytes);
        if (!resultJson) {
            console.log('*** No result');
            return -1;
        }
        const result = JSON.parse(resultJson);
        console.log('*** Result:', result);
        return result.QuantityValue;
    }
    catch (error) {
        console.log("Error: ", error);
        return -1;
    }
}

export function doFail(msgString: string): never {
    console.error(`${RED}\t${msgString}${RESET}`);
    throw new Error(msgString);
}

async function generateproof_send(contract: Contract, assetID: string, input: { a: string; b: string }, receiving_org: string): Promise<void> {
    if(orgs_satisfy_set.includes(receiving_org)) {
        console.log('\n--> Submit Transaction: Generating Proof and sending to org2, assetID:', assetID);
        try {
            if (!fs.existsSync('zkp_files/proof_info.json')) {
                // Measure time taken to generate the proof
                const startGenTime = Date.now();
                // Load the WASM file and zkey file
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    input, 
                    circuitWasmPath, 
                    zkeyPath
                );
                const endGenTime = Date.now();
                const genTime = endGenTime - startGenTime;
                const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
                
                // Append proof generation time to a file
                fs.appendFileSync('zkp_files/generation_time_proof_aggregation.txt', `${total_orgs-1}:${genTime}\n`);
                const proof_info = { vkey: vkey, proof: proof, publicSignals: publicSignals };
                fs.writeFileSync('zkp_files/proof_info.json', JSON.stringify(proof_info, null, 2), 'utf8');
                await createClientSend(JSON.stringify(proof_info));
            }
            else {
                const proof_info_string = fs.readFileSync('zkp_files/proof_info.json', 'utf8');
                const proof_info = JSON.parse(proof_info_string);
                await createClientSend(JSON.stringify(proof_info));
            }
        } catch (err) {
            console.error("Failed to generate proof:", err);
            throw err;  // Rethrow the error to ensure the function fails as expected
        }
    }
    else if(orgs_error_set.includes(receiving_org)) {
        await createClientSend("Error: Can not satisfy request");
    }
}

async function readasset_verifyproof(contract: Contract, assetID: string, proof_info: string): Promise<string> {
    try {
        console.log('\n--> Submit Transaction: Reading and Verifying Proof, assetID:', assetID);
        const vkey = JSON.parse(proof_info).vkey;
        const proof = JSON.parse(proof_info).proof;
        const publicSignals = JSON.parse(proof_info).publicSignals;
        const resultBytes = await contract.evaluateTransaction('ReadProofVerify', assetID, JSON.stringify(vkey), JSON.stringify(proof), JSON.stringify(publicSignals));
        const result = JSON.parse(utf8Decoder.decode(resultBytes));
        console.log("\nReturn: ", result);
        // Append proof verification time to a file
        fs.appendFileSync('zkp_files/verification_time.txt', `${result.VerifyTime}\n`);
        if (result.Validity) {
            return "Verified";
        }
        else {
            return "Not Verified";
        }
    }
    catch(error) {
        console.error(proof_info);
        return "Not Verified";
    }
}

// Function to create the TLS server
async function createServer(contract: Contract, assetID: string): Promise<void> {
    const server = new WebSocket.Server({ port: 8081 });
    server.on('connection', (ws: any) => {
      
        // Listen for messages from the client
        ws.on('message', (message: string) => {
          proof_info_string = message;
        });
      });
}

// Function to create the TLS client
async function createClientSend(proof_info: string): Promise<string> {
    const client1 = new WebSocket('ws://localhost:8081');

    client1.on('open', () => {

    // Send a message to the server
    client1.send(proof_info);
    });
    return "Proof Sent";
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}