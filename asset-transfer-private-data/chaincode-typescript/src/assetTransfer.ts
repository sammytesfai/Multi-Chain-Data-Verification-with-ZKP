/*
 * SPDX-License-Identifier: Apache-2.0
 */
import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Asset } from './asset';
import { AssetPrivateDetails } from './assetTransferDetails';
import { TransientAssetDelete, TransientAssetOwner, TransientAssetProperties, TransientAssetPurge, TransientAssetValue, TransientAssetQuery, TransientAssetProof, TransientProofResults } from './assetTransferTransientInput';
import { TransferAgreement } from './transferAgreement';
import * as snarkjs from 'snarkjs';

const assetCollection = 'assetCollection';
const transferAgreementObjectType = 'transferAgreement';
const transferQueryObjectType = 'query';
const transferProofObjectType = 'proof';

@Info({ title: 'AssetTransfer', description: 'Smart contract for trading assets' })
export class AssetTransfer extends Contract {

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateAsset(ctx: Context): Promise<void> {
        const transientMap = ctx.stub.getTransient();
        const assetProperties = new TransientAssetProperties(transientMap);

        // Check if asset already exists
        const assetAsBytes = await ctx.stub.getPrivateData(assetCollection, assetProperties.assetID);
        if (assetAsBytes.length !== 0) {
            throw new Error('this asset already exists: ' + assetProperties.assetID);
        }

        // Get ID of submitting client identity
        const clientID = ctx.clientIdentity.getID();

        // Verify that the client is submitting request to peer in their organization
        // This is to ensure that a client from another org doesn't attempt to read or
        // write private data from this peer.
        this.verifyClientOrgMatchesPeerOrg(ctx);

        const asset: Asset = {
            ID: assetProperties.assetID,
            Color: assetProperties.color,
            Size: assetProperties.size,
            Owner: clientID,
        };

        // Save asset to private data collection
        // Typical logger, logs to stdout/file in the fabric managed docker container, running this chaincode
        // Look for container name like dev-peer0.org1.example.com-{chaincodename_version}-xyz
        await ctx.stub.putPrivateData(assetCollection, asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));

        // Save asset details to collection visible to owning organization
        const assetPrivateDetails: AssetPrivateDetails = {
            ID: assetProperties.assetID,
            QuantityValue: assetProperties.quantityvalue,
        };
        // Get collection name for this organization.
        const orgCollection = this.getCollectionName(ctx);
        // Put asset appraised value into owners org specific private data collection
        console.log('Put: collection %v, ID %v', orgCollection, assetProperties.assetID);
        await ctx.stub.putPrivateData(orgCollection, asset.ID, Buffer.from(stringify(sortKeysRecursive(assetPrivateDetails))));
    }

    // SendAssetQuery is used by the potential buyer of the asset to ato query for an asset by checking if the sender has enough.
    @Transaction()
    public async SendAssetQuery(ctx: Context, assetID: string, quantityValue: number): Promise<void> {
        const buyerID = ctx.clientIdentity.getID();
        if (!buyerID) {
            throw new Error('Failed to get buyer identity');
        }
        const assetquery: TransientAssetQuery = {
            assetID: assetID,
            quantityvalue: quantityValue,
            buyerID: buyerID,
        }

        // const querykey = `ASSET_QUERY_${assetID}`;
        // const queryBytes = Buffer.from(JSON.stringify(assetquery));
        // await ctx.stub.putState(querykey, queryBytes);
        const transferQueryKey = ctx.stub.createCompositeKey(transferQueryObjectType, [assetquery.assetID]);
        await ctx.stub.putPrivateData(assetCollection, transferQueryKey, Buffer.from(stringify(sortKeysRecursive(assetquery))));
    }

    // ReadAssetQuery is used by the sender of the asset read the query that the buyer sent to identify later if they meet the needs of the buyer.
    @Transaction()
    public async ReadAssetQuery(ctx: Context, assetID: string): Promise<TransientAssetQuery> {
        const transferQueryKey = ctx.stub.createCompositeKey(transferQueryObjectType, [assetID]);
        const querybytes = await ctx.stub.getPrivateData(assetCollection, transferQueryKey);

        // const querykey = `ASSET_QUERY_${assetID}`;
        // const querybytes: Uint8Array = await ctx.stub.getState(querykey);
        // if (!querybytes || querybytes.length === 0) {
        //     throw new Error(`Asset query with ID ${assetID} does not exist`);
        // }

        let assetQuery: TransientAssetQuery;
        try {
            const queryJsonString = Buffer.from(querybytes).toString();
            assetQuery = JSON.parse(queryJsonString);
        } catch (err) {
            throw new Error(`Failed to unmarshal asset query: ${err}`);
        }
        return assetQuery;
    }

    // SendAssetProof is used by the sender of the asset to send a proof for the buyer to verify they have the quantity required.
    @Transaction()
    public async SendAssetProof(ctx: Context, assetID: string, vkey: string, proof: string, publicsignals: string): Promise<void> {
        // const proofkey = `ASSET_PROOF_${assetID}`;
        const assetproof: TransientAssetProof = {
            assetID: assetID,
            vkey: vkey,
            proof: proof,
            publicsignals: publicsignals,
        }

        const transferProofKey = ctx.stub.createCompositeKey(transferProofObjectType, [assetID]);
        await ctx.stub.putPrivateData(assetCollection, transferProofKey, Buffer.from(stringify(sortKeysRecursive(assetproof))));

        // const proofbytes = Buffer.from(JSON.stringify(assetproof));
        // await ctx.stub.putState(proofkey, proofbytes);
    }

    // ReadProofVerify is used by the sender of the asset read the query that the buyer sent to identify later if they meet the needs of the buyer.
    @Transaction()
    public async ReadProofVerify(ctx: Context, assetID: string): Promise<TransientProofResults> {
        const tranferProofKey = ctx.stub.createCompositeKey(transferProofObjectType, [assetID]);
        const proofbytes = await ctx.stub.getPrivateData(assetCollection, tranferProofKey);

        
        // const proofkey = `ASSET_PROOF_${assetID}`;
        // const proofbytes: Uint8Array = await ctx.stub.getState(proofkey);
        if (!proofbytes || proofbytes.length === 0) {
            throw new Error(`Asset query with ID ${assetID} does not exist`);
        }

        let assetproof: TransientAssetProof;
        try {
            const queryJsonString = Buffer.from(proofbytes).toString();
            assetproof = JSON.parse(queryJsonString);
        } catch (err) {
            throw new Error(`Failed to unmarshal asset query: ${err}`);
        }

        const vkey = JSON.parse(assetproof.vkey);
        const proof = JSON.parse(assetproof.proof);
        const publicsignals: string[] = JSON.parse(assetproof.publicsignals);
        assetproof.vkey = JSON.parse(assetproof.vkey);
        assetproof.proof = JSON.parse(assetproof.proof);

        // Measure time taken to generate the proof
        const startVerifyTime = Date.now();
        const isValid = await snarkjs.groth16.verify(vkey, publicsignals, proof);
        const endVerifyTime = Date.now();
        const VerifyTime = endVerifyTime - startVerifyTime;

        
        if (isValid && publicsignals.map(item => Number(item))[0]) {  // Assuming `oldEnough` is the first public signal
            
            let proofresults: TransientProofResults = {
                Validity: true,
                VerifyTime: VerifyTime,
            }
            return proofresults;
        } else {
            let proofresults: TransientProofResults = {
                Validity: false,
                VerifyTime: VerifyTime,
            }
            return proofresults;
        }
    }

    // AgreeToTransfer is used by the potential buyer of the asset to agree to the
    // asset value. The agreed to appraisal value is stored in the buying orgs
    // org specifc collection, while the the buyer client ID is stored in the asset collection
    // using a composite key
    @Transaction()
    public async AgreeToTransfer(ctx: Context): Promise<void> {
        // Get ID of submitting client identity
        const clientID = ctx.clientIdentity.getID();
        // Value is private, therefore it gets passed in transient field
        const transientMap = ctx.stub.getTransient();
        const assetValue = new TransientAssetValue(transientMap);
        const buyer_asset_ID = clientID.match(/O=([^/]+)\//g)![1].match(/O=([^/.]+)/)?.[1] + assetValue.assetID.match(/(asset\d+)/)![1];
        const valueJSON: AssetPrivateDetails = {
            ID: buyer_asset_ID,
            QuantityValue: assetValue.quantityvalue,
        };
        
        // Verify that the client is submitting request to peer in their organization
        this.verifyClientOrgMatchesPeerOrg(ctx);

        // Get collection name for this organization. Needs to be read by a member of the organization.
        const orgCollection = this.getCollectionName(ctx);
        console.log(`AgreeToTransfer Put: collection ${orgCollection}, ID ${valueJSON.ID}`);
        // Put agreed value in the org specifc private data collection
        await ctx.stub.putPrivateData(orgCollection, buyer_asset_ID, Buffer.from(stringify(sortKeysRecursive(valueJSON))));
        // Create agreeement that indicates which identity has agreed to purchase
        // In a more realistic transfer scenario, a transfer agreement would be secured to ensure that it cannot
        // be overwritten by another channel member
        const transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [assetValue.assetID]);
        console.log(`AgreeToTransfer Put: collection ${assetCollection}, ID ${assetValue.assetID}, Key ${transferAgreeKey}`);
        await ctx.stub.putPrivateData(assetCollection, transferAgreeKey, new Uint8Array(Buffer.from(clientID)));
    }

    @Transaction()
    // TransferAsset transfers the asset to the new owner by setting a new owner ID
    public async TransferAsset(ctx: Context): Promise<Asset> {
        // Asset properties are private, therefore they get passed in transient field
        const transientMap = ctx.stub.getTransient();
        const assetOwner = new TransientAssetOwner(transientMap);

        console.log('TransferAsset: verify asset exists ID ' + assetOwner.assetID);
        // Read asset from the private data collection
        const asset = await this.ReadAsset(ctx, assetOwner.assetID);
        // Verify that the client is submitting request to peer in their organization
        this.verifyClientOrgMatchesPeerOrg(ctx);
        // Verify transfer details and transfer owner
        const remaining_owner_quantity = await this.verifyAgreement(ctx, assetOwner.assetID, asset.Owner, assetOwner.buyer_quantity_value);

        const transferAgreement = await this.ReadTransferAgreement(ctx, assetOwner.assetID);
        
        // Regular expression to capture the organization after `/O=`
        const new_owner_org = transferAgreement.BuyerID.match(/O=([^/]+)\//g)![1].match(/O=([^/.]+)/)?.[1];
        const raw_asset_id = assetOwner.assetID.match(/(asset\d+)/)![1];

        if (transferAgreement.BuyerID === '') {
            throw new Error('BuyerID not found in TransferAgreement for ' + assetOwner.assetID);
        }
        if (remaining_owner_quantity > 0) {
            const collectionOwner = this.getCollectionName(ctx); // get owner collection from caller identity

            const owner_asset_private_data_bytes = await ctx.stub.getPrivateData(collectionOwner, assetOwner.assetID);
            const owner_asset_private_data = AssetPrivateDetails.fromBytes(owner_asset_private_data_bytes);
            owner_asset_private_data.QuantityValue = remaining_owner_quantity;
            // Save the updated asset with the reduced quantity
            console.log(`TransferAsset Put: collection ${collectionOwner}, ID ${assetOwner.assetID}, Updated Quantity: ${remaining_owner_quantity}`);
            await ctx.stub.putPrivateData(collectionOwner, assetOwner.assetID, Buffer.from(stringify(owner_asset_private_data)));
            
            // Create a new asset entry for the buyer with the transferred quantity
            let buyerAsset: Asset = {
                ID: new_owner_org + raw_asset_id,
                Color: asset.Color,
                Size: asset.Size,
                Owner: transferAgreement.BuyerID
            }

            // const buyerAsset = { ...asset, ID: new_owner_org + raw_asset_id, Owner: transferAgreement.BuyerID, Quantity: assetOwner.buyer_quantity_value };
            // const buyerAssetKey = ctx.stub.createCompositeKey('asset', [transferAgreement.BuyerID, new_owner_org + raw_asset_id]);
            await ctx.stub.putPrivateData(assetCollection, new_owner_org + raw_asset_id, Buffer.from(stringify(buyerAsset)));
            return buyerAsset;
        }
        else
        {
            // Transfer asset in private data collection to new owner
            asset.Owner = transferAgreement.BuyerID;
            asset.ID = new_owner_org + raw_asset_id;
            console.log(`TransferAsset Put: collection ${assetCollection}, ID ${assetOwner.assetID}`);
            await ctx.stub.putPrivateData(assetCollection, assetOwner.assetID, Buffer.from(stringify(asset))); // rewrite the asset
            // Get collection name for this organization
            const ownersCollection = this.getCollectionName(ctx);
            // Delete the asset appraised value from this organization's private data collection
            await ctx.stub.deletePrivateData(ownersCollection, assetOwner.assetID);
            // Delete the transfer agreement from the asset collection
            const transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [assetOwner.assetID]);
            await ctx.stub.deletePrivateData(assetCollection, transferAgreeKey);
            return asset;
        }
    }

    @Transaction()
    // DeleteAsset can be used by the owner of the asset to delete the asset
    public async DeleteAsset(ctx: Context): Promise<void> {
        // Value is private, therefore it gets passed in transient field
        const transientMap = ctx.stub.getTransient();
        const assetDelete = new TransientAssetDelete(transientMap);

        // Verify that the client is submitting request to peer in their organization
        this.verifyClientOrgMatchesPeerOrg(ctx);

        console.log('Deleting Asset: ' + assetDelete.assetID);
        // get the asset from chaincode state
        const valAsbytes = await ctx.stub.getPrivateData(assetCollection, assetDelete.assetID);
        if (valAsbytes.length === 0) {
            throw new Error('asset not found: ' + assetDelete.assetID);
        }
        const ownerCollection = this.getCollectionName(ctx);
        // Check the asset is in the caller org's private collection
        const valAsbytesPrivate = await ctx.stub.getPrivateData(ownerCollection, assetDelete.assetID);
        if (valAsbytesPrivate.length === 0) {
            throw new Error(`asset not found in owner's private Collection: ${ownerCollection} : ${assetDelete.assetID}`);
        }
        // delete the asset from state
        await ctx.stub.deletePrivateData(assetCollection, assetDelete.assetID);
        // Finally, delete private details of asset
        await ctx.stub.deletePrivateData(ownerCollection, assetDelete.assetID);
    }

    @Transaction()
    // PurgeAsset can be used by the owner of the asset to delete the asset
    // Trigger removal of the asset
    public async PurgeAsset(ctx: Context): Promise<void> {
        // Value is private, therefore it gets passed in transient field
        const transientMap = ctx.stub.getTransient();
        const assetPurge = new TransientAssetPurge(transientMap);

        // Verify that the client is submitting request to peer in their organization
        this.verifyClientOrgMatchesPeerOrg(ctx);

        console.log('Purging Asset: ' + assetPurge.assetID);
        // Note that there is no check here to see if the id exist; it might have been 'deleted' already
        // so a check here is pointless. We would need to call purge irrespective of the result
        // A delete can be called before purge, but is not essential
        const ownerCollection = this.getCollectionName(ctx);
        // delete the asset from state
        await ctx.stub.purgePrivateData(assetCollection, assetPurge.assetID);
        // Finally, delete private details of asset
        await ctx.stub.purgePrivateData(ownerCollection, assetPurge.assetID);
    }

    @Transaction()
    // DeleteTranferAgreement can be used by the buyer to withdraw a proposal from
    // the asset collection and from his own collection.
    public async DeleteTransferAgreement(ctx: Context): Promise<void> {
        // Value is private, therefore it gets passed in transient field
        const transientMap = ctx.stub.getTransient();
        const agreementDelete = new TransientAssetDelete(transientMap);

        // Verify that the client is submitting request to peer in their organization
        this.verifyClientOrgMatchesPeerOrg(ctx);

        // Delete private details of agreement
        // Get proposers collection.
        const orgCollection = this.getCollectionName(ctx);
        // Delete the transfer agreement from the asset collection
        const transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [agreementDelete.assetID]);
        // get the transfer_agreement
        const valAsbytes = await ctx.stub.getPrivateData(assetCollection, transferAgreeKey);

        if (valAsbytes.length === 0) {
            throw new Error(`asset's transfer_agreement does not exist: ${agreementDelete.assetID}`);
        }
        // Delete the asset
        await ctx.stub.deletePrivateData(orgCollection, agreementDelete.assetID);
        // Delete transfer agreement record, remove agreement from state
        await ctx.stub.deletePrivateData(assetCollection, transferAgreeKey);
    }

    /*
        GETTERS
    */

    // ReadAsset reads the information from collection
    @Transaction()
    public async ReadAsset(ctx: Context, id: string): Promise<Asset> {
        // Check if asset already exists
        const assetAsBytes = await ctx.stub.getPrivateData(assetCollection, id);
        // No Asset found, return empty response
        if (assetAsBytes.length === 0) {
            throw new Error(id + ' does not exist in collection ' + assetCollection);
        }
        return Asset.fromBytes(assetAsBytes);
    }

    // ReadAssetPrivateDetails reads the asset private details in organization specific collection
    @Transaction()
    public async ReadAssetPrivateDetails(ctx: Context, collection: string, id: string): Promise<AssetPrivateDetails> {
        const detailBytes = await ctx.stub.getPrivateData(collection, id);

        if (detailBytes.length === 0) {
            throw new Error(id + ' does not exist in collection ' + collection);
        }
        return AssetPrivateDetails.fromBytes(detailBytes);
    }

    // ReadTransferAgreement gets the buyer's identity from the transfer agreement from collection
    @Transaction()
    public async ReadTransferAgreement(ctx: Context, assetID: string): Promise<TransferAgreement> {
        // composite key for TransferAgreement of this asset
        const transferAgreeKey = ctx.stub.createCompositeKey(transferAgreementObjectType, [assetID]);
        // Get the identity from collection
        const buyerIdentity = await ctx.stub.getPrivateData(assetCollection, transferAgreeKey);

        if (buyerIdentity.length === 0) {
            throw new Error(`TransferAgreement for ${assetID} does not exist `);
        }

        return {
            ID: assetID,
            BuyerID: String(buyerIdentity),
        };
    }

    // GetAssetByRange performs a range query based on the start and end keys provided. Range
    // queries can be used to read data from private data collections, but can not be used in
    // a transaction that also writes to private data.
    @Transaction()
    public async GetAssetByRange(ctx: Context, startKey: string, endKey: string): Promise<Asset[]> {
        const resultsIterator = ctx.stub.getPrivateDataByRange(assetCollection, startKey, endKey);
        const results: Asset[] = [];
        for await (const res of resultsIterator) {
            const asset = Asset.fromBytes(res.value);
            results.push(asset);
        }
        return results;
    }
    /*
        HELPERS
    */
    // verifyAgreement is an internal helper function used by TransferAsset to verify
    // that the transfer is being initiated by the owner and that the buyer has agreed
    // to the same appraisal value as the owner
    public async verifyAgreement(ctx: Context, assetID: string, owner: string, buyer_quantity_value: number): Promise<number> {
        // Check 1: verify that the transfer is being initiatied by the owner
        // Get ID of submitting client identity
        const clientID = ctx.clientIdentity.getID();
        if (clientID !== owner) {
            throw new Error(`error: submitting client(${clientID}) identity does not own asset ${assetID}.Owner is ${owner}`);
        }
        // Check 2: verify that the buyer has agreed to the appraised value
        // Get collection names
        const collectionOwner = this.getCollectionName(ctx); // get owner collection from caller identity

        const owner_quanity_value_bytes = await ctx.stub.getPrivateData(collectionOwner, assetID);
        const owner_quanity_value = AssetPrivateDetails.fromBytes(owner_quanity_value_bytes)
        if (owner_quanity_value.QuantityValue < buyer_quantity_value) {
            throw new Error(`Quantity value held by owner for ${assetID} does not satisfy the buyers request`);
        }
        return owner_quanity_value.QuantityValue - buyer_quantity_value;
    }
    // getCollectionName is an internal helper function to get collection of submitting client identity.
    public getCollectionName(ctx: Context): string {
        // Get the MSP ID of submitting client identity
        const clientMSPID = ctx.clientIdentity.getMSPID();
        // Create the collection name
        const orgCollection = clientMSPID + 'PrivateCollection';

        return orgCollection;
    }
    // Get ID of submitting client identity
    public submittingClientIdentity(ctx: Context): string {

        const b64ID = ctx.clientIdentity.getID();

        // base64.StdEncoding.DecodeString(b64ID);
        const decodeID = Buffer.from(b64ID, 'base64').toString('binary');

        return String(decodeID);
    }
    // verifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
    public verifyClientOrgMatchesPeerOrg(ctx: Context): void {

        const clientMSPID = ctx.clientIdentity.getMSPID();

        const peerMSPID = ctx.stub.getMspID();

        if (clientMSPID !== peerMSPID) {
            throw new Error('client from org %v is not authorized to read or write private data from an org ' + clientMSPID + ' peer ' + peerMSPID);
        }
    }
    // =======Rich queries =========================================================================
    // Two examples of rich queries are provided below (parameterized query and ad hoc query).
    // Rich queries pass a query string to the state database.
    // Rich queries are only supported by state database implementations
    //  that support rich query (e.g. CouchDB).
    // The query string is in the syntax of the underlying state database.
    // With rich queries there is no guarantee that the result set hasn't changed between
    //  endorsement time and commit time, aka 'phantom reads'.
    // Therefore, rich queries should not be used in update transactions, unless the
    // application handles the possibility of result set changes between endorsement and commit time.
    // Rich queries can be used for point-in-time queries against a peer.
    // ============================================================================================

    // ===== Example: Parameterized rich query =================================================

    // QueryAssetByOwner queries for assets based on assetType, owner.
    // This is an example of a parameterized query where the query logic is baked into the chaincode,
    // and accepting a single query parameter (owner).
    // Only available on state databases that support rich query (e.g. CouchDB)
    // =========================================================================================
    public async QueryAssetByOwner(ctx: Context, assetType: string, owner: string): Promise<Asset[]>  {

        const queryString = `{'selector':{'objectType':'${assetType}','owner':'${owner}'}}`;

        return await this.getQueryResultForQueryString(ctx, queryString);
    }

    public QueryAssets(ctx: Context, queryString: string): Promise<Asset[]>  {
        return this.getQueryResultForQueryString(ctx, queryString);
    }

    public async getQueryResultForQueryString(ctx: Context, queryString: string): Promise<Asset[]> {

        const resultsIterator = ctx.stub.getPrivateDataQueryResult(assetCollection, queryString);

        const results: Asset[] = [];

        for await (const res of resultsIterator) {
            const asset = Asset.fromBytes(res.value);
            results.push(asset);
        }

        return results;
    }
}
