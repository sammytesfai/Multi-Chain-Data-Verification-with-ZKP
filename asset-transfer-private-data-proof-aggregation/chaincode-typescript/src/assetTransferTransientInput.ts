/*
  SPDX-License-Identifier: Apache-2.0
*/

import { nonEmptyString, positiveNumber } from "./utils";

export class TransientAssetProperties {
    objectType: string;
    assetID: string;
    color: string;
    size: number;
    quantityvalue: number;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_properties");
        if (!transient?.length) {
            throw new Error("no asset properties");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetProperties>;

        this.objectType = nonEmptyString(properties.objectType, "objectType field must be a non-empty string");
        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
        this.color = nonEmptyString(properties.color, "color field must be a non-empty string");
        this.size = positiveNumber(properties.size, "size field must be a positive integer");
        this.quantityvalue = positiveNumber(
            properties.quantityvalue,
            "quantityvalue field must be a positive integer"
        );
    }
}

export class TransientAssetValue {
    assetID: string;
    quantityvalue: number;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_value");
        if (!transient?.length) {
            throw new Error("no asset value");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetValue>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
        this.quantityvalue = positiveNumber(
            properties.quantityvalue,
            "quantityvalue field must be a positive integer"
        );
    }
}

export class TransientAssetQuery {
    assetID: string;
    quantityvalue: number;
    buyerID: string;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_value");
        if (!transient?.length) {
            throw new Error("no asset value");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetQuery>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
        this.quantityvalue = positiveNumber(
            properties.quantityvalue,
            "quantityvalue field must be a positive integer"
        );
        this.buyerID = nonEmptyString(properties.buyerID, "buyerMSP field must be a non-empty string");
    }
}

export class TransientAssetProof {
    assetID: string;
    vkey: string;
    proof: string;
    publicsignals: string;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_value");
        if (!transient?.length) {
            throw new Error("no asset value");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetProof>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
        this.vkey = nonEmptyString(properties.vkey, "verification key field must be a non-empty string");
        this.proof = nonEmptyString(properties.proof, "proof field must be a non-empty string");
        this.publicsignals = nonEmptyString(properties.publicsignals, "proof field must be a non-empty string");
    }
}

export class TransientProofResults{
    Validity: boolean;
    VerifyTime: number;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_value");
        if (!transient?.length) {
            throw new Error("no asset value");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientProofResults>;

        this.VerifyTime = positiveNumber(
            properties.VerifyTime,
            "VerifyTime field must be a positive integer"
        );
        this.Validity = false;
    }
}

export class TransientAssetOwner {
    assetID: string;
    buyerMSP: string;
    buyer_quantity_value: number;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_owner");
        if (!transient?.length) {
            throw new Error("no asset owner");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetOwner>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
        this.buyerMSP = nonEmptyString(properties.buyerMSP, "buyerMSP field must be a non-empty string");
        this.buyer_quantity_value = positiveNumber(
            properties.buyer_quantity_value,
            "buyer_quantity_value field must be a positive integer"
        );
    }
}

export class TransientAssetDelete {
    assetID: string;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_delete");
        if (!transient?.length) {
            throw new Error("no asset delete");
        }
        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetOwner>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
    }
}

export class TransientAssetPurge {
    assetID: string;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("asset_purge");
        if (!transient?.length) {
            throw new Error("no asset purge");
        }

        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetOwner>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
    }
}

export class TransientAgreementDelete {
    assetID: string;

    constructor(transientMap: Map<string, Uint8Array>) {
        const transient = transientMap.get("agreement_delete");
        if (!transient?.length) {
            throw new Error("no agreement delete");
        }

        const json = Buffer.from(transient).toString();
        const properties = JSON.parse(json) as Partial<TransientAssetOwner>;

        this.assetID = nonEmptyString(properties.assetID, "assetID field must be a non-empty string");
    }
}
