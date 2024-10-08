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
const QuantityValueRequested = 99; 

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
        await createAssets(contractOrg1, 'org1' + assetID1);

        await readAssetByID(contractOrg1, 'org1' + assetID1);

        // Read asset from the Org1's private data collection with ID in the given range.
        await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Measure time taken to generate the proof
        console.time("Communication Time");
        const startGenTime = Date.now();

        // Make agreement to transfer the asset from Org1 to Org2.
        await sendassetquery(contractOrg2, 'org1' + assetID1);

        console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

        // Read transfer agreement.
        const requester_quantity = await readassetquery(contractOrg1, 'org1' + assetID1);
        
        // Input JSON
        const input = {
            a: assets[0]![3].toString(),
            b: requester_quantity.toString()
        };

        const endGenTime = Date.now();
        const genTime = endGenTime - startGenTime;
        console.timeEnd("Communication Time");

        // Append proof generation time to a file
        fs.appendFileSync('zkp_files/communication_time.txt', `Communication Time: ${genTime} ms\n`);


        // Run the proof generation and verification
        await generateproof_send(contractOrg1, 'org1' + assetID1, input);

        console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');

        // Read Proof details and verify proof
        const proof_results = await readasset_verifyproof(contractOrg2, 'org1' + assetID1);
        console.log("Proof: ", proof_results);

        if (proof_results == "Verified") {
            // Make agreement to transfer the asset from Org1 to Org2.
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);
            await agreeToTransfer(contractOrg2, 'org1' + assetID1);
            await readAssetByID(contractOrg1, 'org1' + assetID1);
            await readAssetPrivateDetails(contractOrg1, 'org1' + assetID1, org1PrivateCollectionName);

            await readAssetPrivateDetails(contractOrg2, 'org2' + assetID1, org2PrivateCollectionName);
        
            console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');

            // Read transfer agreement.
            await readTransferAgreement(contractOrg1, 'org1' + assetID1);

            await readAssetByID(contractOrg1, 'org1' + assetID1);

            // // Transfer asset to Org2.
            await transferAsset(contractOrg1, 'org1' + assetID1, requester_quantity);

            // // Again ReadAsset : results will show that the buyer identity now owns the asset.
            await readAssetByID(contractOrg1, 'org1' + assetID1);

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

async function sendassetquery(contract: Contract, assetID: string): Promise<void> {
    // Buyer from Org2 sends a query to the seller regarding an asset with an appraised value
    const quantityvalue = QuantityValueRequested;
    const assetQueryData = { assetID, quantityvalue };
    console.log('\n--> Submit Transaction: SendAssetQuery, payload:', assetQueryData);

    await contract.submitTransaction('SendAssetQuery', assetID, quantityvalue.toString());

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
    return result.quantityvalue;
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
    const restultbytes = await contract.submit('TransferAsset', {
        transientData: { asset_owner: JSON.stringify(buyerDetails) },
    });
    const resultstring = utf8Decoder.decode(restultbytes);
    if (!resultstring) {
        doFail('Received no result for ReadTransferAgreement');
    }
    const result: unknown = JSON.parse(resultstring);
    console.log('*** Transaction committed successfully');
    console.log('*** Result:', result);
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

async function generateproof_send(contract: Contract, assetID: string, input: { a: string; b: string }): Promise<void> {
    console.log('\n--> Submit Transaction: Generating Proof and sending to org2, assetID:', assetID);
    try {
        // Measure time taken to generate the proof
        const startGenTime = Date.now();

        // Load the WASM file and zkey file
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input, 
            circuitWasmPath, 
            zkeyPath
        );
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

        const endGenTime = Date.now();
        const genTime = endGenTime - startGenTime;
        
        // Append proof generation time to a file
        fs.appendFileSync('zkp_files/generation_time.txt', `Proof Generation Time: ${genTime} ms\n`);
        console.log('*** Result:', {assetID: assetID, vkey: vkey, proof: proof, publicSignals:  publicSignals});
        await contract.submitTransaction('SendAssetProof', assetID, JSON.stringify(vkey), JSON.stringify(proof), JSON.stringify(publicSignals));
        // Write the proof and public signals to files
        fs.writeFileSync('zkp_files/proof.json', JSON.stringify(proof));
        fs.writeFileSync('zkp_files/public.json', JSON.stringify(publicSignals));
    } catch (err) {
        console.error("Failed to generate proof:", err);
        throw err;  // Rethrow the error to ensure the function fails as expected
    }
}

async function readasset_verifyproof(contract: Contract, assetID: string): Promise<string> {
    console.log('\n--> Submit Transaction: Reading and Verifying Proof, assetID:', assetID);
    const resultBytes = await contract.evaluateTransaction('ReadProofVerify', assetID);
    const result = JSON.parse(utf8Decoder.decode(resultBytes));
    console.log("\nReturn: ", result);
    // Append proof verification time to a file
    fs.appendFileSync('zkp_files/verification_time.txt', `Proof Verification Time: ${result.VerifyTime} ms\n`);
    if (result.Validity) {
        return "Verified";
    }
    else {
        return "Not Verified";
    }
}