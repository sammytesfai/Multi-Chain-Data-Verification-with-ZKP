"use strict";
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.doFail = void 0;
var fabric_gateway_1 = require("@hyperledger/fabric-gateway");
var util_1 = require("util");
var connect_1 = require("./connect");
var channelName = 'channel1';
var chaincodeName = 'private';
var mspIdOrg1 = 'Org1MSP';
var mspIdOrg2 = 'Org2MSP';
var utf8Decoder = new util_1.TextDecoder();
// Collection Names
var org1PrivateCollectionName = 'Org1MSPPrivateCollection';
var org2PrivateCollectionName = 'Org2MSPPrivateCollection';
var RED = '\x1b[31m\n';
var RESET = '\x1b[0m';
// Use a unique key so that we can run multiple times
var now = Date.now();
var assetID1 = "asset".concat(String(now));
var assetID2 = "asset".concat(String(now + 1));
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var clientOrg1, gatewayOrg1, _a, clientOrg2, gatewayOrg2, _b, contractOrg1, contractOrg2, e_1, org1ReadSuccess, org2ReadSuccess, e_2;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, connect_1.newGrpcConnection)(connect_1.tlsCertPathOrg1, connect_1.peerEndpointOrg1, connect_1.peerNameOrg1)];
                case 1:
                    clientOrg1 = _e.sent();
                    _a = fabric_gateway_1.connect;
                    _c = {
                        client: clientOrg1
                    };
                    return [4 /*yield*/, (0, connect_1.newIdentity)(connect_1.certDirectoryPathOrg1, mspIdOrg1)];
                case 2:
                    _c.identity = _e.sent();
                    return [4 /*yield*/, (0, connect_1.newSigner)(connect_1.keyDirectoryPathOrg1)];
                case 3:
                    gatewayOrg1 = _a.apply(void 0, [(_c.signer = _e.sent(),
                            _c)]);
                    return [4 /*yield*/, (0, connect_1.newGrpcConnection)(connect_1.tlsCertPathOrg2, connect_1.peerEndpointOrg2, connect_1.peerNameOrg2)];
                case 4:
                    clientOrg2 = _e.sent();
                    _b = fabric_gateway_1.connect;
                    _d = {
                        client: clientOrg2
                    };
                    return [4 /*yield*/, (0, connect_1.newIdentity)(connect_1.certDirectoryPathOrg2, mspIdOrg2)];
                case 5:
                    _d.identity = _e.sent();
                    return [4 /*yield*/, (0, connect_1.newSigner)(connect_1.keyDirectoryPathOrg2)];
                case 6:
                    gatewayOrg2 = _b.apply(void 0, [(_d.signer = _e.sent(),
                            _d)]);
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, , 27, 28]);
                    contractOrg1 = gatewayOrg1
                        .getNetwork(channelName)
                        .getContract(chaincodeName);
                    contractOrg2 = gatewayOrg2
                        .getNetwork(channelName)
                        .getContract(chaincodeName);
                    console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');
                    // Create new assets on the ledger.
                    return [4 /*yield*/, createAssets(contractOrg1)];
                case 8:
                    // Create new assets on the ledger.
                    _e.sent();
                    // Read asset from the Org1's private data collection with ID in the given range.
                    return [4 /*yield*/, getAssetsByRange(contractOrg1)];
                case 9:
                    // Read asset from the Org1's private data collection with ID in the given range.
                    _e.sent();
                    _e.label = 10;
                case 10:
                    _e.trys.push([10, 12, , 13]);
                    // Attempt to transfer asset without prior aprroval from Org2, transaction expected to fail.
                    console.log('\nAttempt TransferAsset without prior AgreeToTransfer');
                    return [4 /*yield*/, transferAsset(contractOrg1, assetID1)];
                case 11:
                    _e.sent();
                    doFail('TransferAsset transaction succeeded when it was expected to fail');
                    return [3 /*break*/, 13];
                case 12:
                    e_1 = _e.sent();
                    console.log('*** Received expected error:', e_1);
                    return [3 /*break*/, 13];
                case 13:
                    console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');
                    // Read the asset by ID.
                    return [4 /*yield*/, readAssetByID(contractOrg2, assetID1)];
                case 14:
                    // Read the asset by ID.
                    _e.sent();
                    // Make agreement to transfer the asset from Org1 to Org2.
                    return [4 /*yield*/, agreeToTransfer(contractOrg2, assetID1)];
                case 15:
                    // Make agreement to transfer the asset from Org1 to Org2.
                    _e.sent();
                    console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');
                    // Read transfer agreement.
                    return [4 /*yield*/, readTransferAgreement(contractOrg1, assetID1)];
                case 16:
                    // Read transfer agreement.
                    _e.sent();
                    // Transfer asset to Org2.
                    return [4 /*yield*/, transferAsset(contractOrg1, assetID1)];
                case 17:
                    // Transfer asset to Org2.
                    _e.sent();
                    // Again ReadAsset : results will show that the buyer identity now owns the asset.
                    return [4 /*yield*/, readAssetByID(contractOrg1, assetID1)];
                case 18:
                    // Again ReadAsset : results will show that the buyer identity now owns the asset.
                    _e.sent();
                    return [4 /*yield*/, readAssetPrivateDetails(contractOrg1, assetID1, org1PrivateCollectionName)];
                case 19:
                    org1ReadSuccess = _e.sent();
                    if (org1ReadSuccess) {
                        doFail("Asset private data still exists in ".concat(org1PrivateCollectionName));
                    }
                    console.log('\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~');
                    return [4 /*yield*/, readAssetPrivateDetails(contractOrg2, assetID1, org2PrivateCollectionName)];
                case 20:
                    org2ReadSuccess = _e.sent();
                    if (!org2ReadSuccess) {
                        doFail("Asset private data not found in ".concat(org2PrivateCollectionName));
                    }
                    _e.label = 21;
                case 21:
                    _e.trys.push([21, 23, , 24]);
                    console.log('\nAttempt DeleteAsset using non-owner organization');
                    return [4 /*yield*/, deleteAsset(contractOrg2, assetID2)];
                case 22:
                    _e.sent();
                    doFail('DeleteAsset transaction succeeded when it was expected to fail');
                    return [3 /*break*/, 24];
                case 23:
                    e_2 = _e.sent();
                    console.log('*** Received expected error:', e_2);
                    return [3 /*break*/, 24];
                case 24:
                    console.log('\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~');
                    // Delete AssetID2 as Org1.
                    return [4 /*yield*/, deleteAsset(contractOrg1, assetID2)];
                case 25:
                    // Delete AssetID2 as Org1.
                    _e.sent();
                    // Trigger a purge of the private data for the asset
                    // The previous delete is optinal if purge is used
                    return [4 /*yield*/, purgeAsset(contractOrg1, assetID2)];
                case 26:
                    // Trigger a purge of the private data for the asset
                    // The previous delete is optinal if purge is used
                    _e.sent();
                    return [3 /*break*/, 28];
                case 27:
                    gatewayOrg1.close();
                    clientOrg1.close();
                    gatewayOrg2.close();
                    clientOrg2.close();
                    return [7 /*endfinally*/];
                case 28: return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (error) {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});
/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
function createAssets(contract) {
    return __awaiter(this, void 0, void 0, function () {
        var assetType, asset1Data, asset2Data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assetType = 'ValuableAsset';
                    console.log("\n--> Submit Transaction: CreateAsset, ID: ".concat(assetID1));
                    asset1Data = {
                        objectType: assetType,
                        assetID: assetID1,
                        color: 'green',
                        size: 20,
                        appraisedValue: 100
                    };
                    return [4 /*yield*/, contract.submit('CreateAsset', {
                            transientData: { asset_properties: JSON.stringify(asset1Data) }
                        })];
                case 1:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    console.log("\n--> Submit Transaction: CreateAsset, ID: ".concat(assetID2));
                    asset2Data = {
                        objectType: assetType,
                        assetID: assetID2,
                        color: 'blue',
                        size: 35,
                        appraisedValue: 727
                    };
                    return [4 /*yield*/, contract.submit('CreateAsset', {
                            transientData: { asset_properties: JSON.stringify(asset2Data) }
                        })];
                case 2:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
function getAssetsByRange(contract) {
    return __awaiter(this, void 0, void 0, function () {
        var resultBytes, resultString, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive).
                    console.log("\n--> Evaluate Transaction: ReadAssetPrivateDetails from ".concat(org1PrivateCollectionName));
                    return [4 /*yield*/, contract.evaluateTransaction('GetAssetByRange', assetID1, "asset".concat(String(now + 2)))];
                case 1:
                    resultBytes = _a.sent();
                    resultString = utf8Decoder.decode(resultBytes);
                    if (!resultString) {
                        doFail('Received empty query list for readAssetPrivateDetailsOrg1');
                    }
                    result = JSON.parse(resultString);
                    console.log('*** Result:', result);
                    return [2 /*return*/];
            }
        });
    });
}
function readAssetByID(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var resultBytes, resultString, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--> Evaluate Transaction: ReadAsset, ID: ".concat(assetID));
                    return [4 /*yield*/, contract.evaluateTransaction('ReadAsset', assetID)];
                case 1:
                    resultBytes = _a.sent();
                    resultString = utf8Decoder.decode(resultBytes);
                    if (!resultString) {
                        doFail('Received empty result for ReadAsset');
                    }
                    result = JSON.parse(resultString);
                    console.log('*** Result:', result);
                    return [2 /*return*/];
            }
        });
    });
}
function agreeToTransfer(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var dataForAgreement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataForAgreement = { assetID: assetID, appraisedValue: 100 };
                    console.log('\n--> Submit Transaction: AgreeToTransfer, payload:', dataForAgreement);
                    return [4 /*yield*/, contract.submit('AgreeToTransfer', {
                            transientData: { asset_value: JSON.stringify(dataForAgreement) }
                        })];
                case 1:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
function readTransferAgreement(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var resultBytes, resultString, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--> Evaluate Transaction: ReadTransferAgreement, ID: ".concat(assetID));
                    return [4 /*yield*/, contract.evaluateTransaction('ReadTransferAgreement', assetID)];
                case 1:
                    resultBytes = _a.sent();
                    resultString = utf8Decoder.decode(resultBytes);
                    if (!resultString) {
                        doFail('Received no result for ReadTransferAgreement');
                    }
                    result = JSON.parse(resultString);
                    console.log('*** Result:', result);
                    return [2 /*return*/];
            }
        });
    });
}
function transferAsset(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var buyerDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--> Submit Transaction: TransferAsset, ID: ".concat(assetID));
                    buyerDetails = { assetID: assetID, buyerMSP: mspIdOrg2 };
                    return [4 /*yield*/, contract.submit('TransferAsset', {
                            transientData: { asset_owner: JSON.stringify(buyerDetails) }
                        })];
                case 1:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
function deleteAsset(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var dataForDelete;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n--> Submit Transaction: DeleteAsset, ID:', assetID);
                    dataForDelete = { assetID: assetID };
                    return [4 /*yield*/, contract.submit('DeleteAsset', {
                            transientData: { asset_delete: JSON.stringify(dataForDelete) }
                        })];
                case 1:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
function purgeAsset(contract, assetID) {
    return __awaiter(this, void 0, void 0, function () {
        var dataForPurge;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n--> Submit Transaction: PurgeAsset, ID:', assetID);
                    dataForPurge = { assetID: assetID };
                    return [4 /*yield*/, contract.submit('PurgeAsset', {
                            transientData: { asset_purge: JSON.stringify(dataForPurge) }
                        })];
                case 1:
                    _a.sent();
                    console.log('*** Transaction committed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
function readAssetPrivateDetails(contract, assetID, collectionName) {
    return __awaiter(this, void 0, void 0, function () {
        var resultBytes, resultJson, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--> Evaluate Transaction: ReadAssetPrivateDetails from ".concat(collectionName, ", ID: ").concat(assetID));
                    return [4 /*yield*/, contract.evaluateTransaction('ReadAssetPrivateDetails', collectionName, assetID)];
                case 1:
                    resultBytes = _a.sent();
                    resultJson = utf8Decoder.decode(resultBytes);
                    if (!resultJson) {
                        console.log('*** No result');
                        return [2 /*return*/, false];
                    }
                    result = JSON.parse(resultJson);
                    console.log('*** Result:', result);
                    return [2 /*return*/, true];
            }
        });
    });
}
function doFail(msgString) {
    console.error("".concat(RED, "\t").concat(msgString).concat(RESET));
    throw new Error(msgString);
}
exports.doFail = doFail;
