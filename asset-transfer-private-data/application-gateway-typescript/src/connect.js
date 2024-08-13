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
exports.newSigner = exports.newIdentity = exports.newGrpcConnection = exports.peerNameOrg2 = exports.peerNameOrg1 = exports.peerEndpointOrg2 = exports.peerEndpointOrg1 = exports.tlsCertPathOrg2 = exports.certDirectoryPathOrg2 = exports.keyDirectoryPathOrg2 = exports.cryptoPathOrg2 = exports.tlsCertPathOrg1 = exports.certDirectoryPathOrg1 = exports.keyDirectoryPathOrg1 = void 0;
var grpc = require("@grpc/grpc-js");
var fabric_gateway_1 = require("@hyperledger/fabric-gateway");
var crypto = require("crypto");
var fs_1 = require("fs");
var path = require("path");
// Path to org1 crypto materials.
var cryptoPathOrg1 = path.resolve(__dirname, '..', '..', '..', 'modified-test-net', 'organizations', 'peerOrganizations', 'org1.example.com');
// Path to org1 user private key directory.
exports.keyDirectoryPathOrg1 = path.resolve(cryptoPathOrg1, 'users', 'User1@org1.example.com', 'msp', 'keystore');
// Path to org1 user certificate.
exports.certDirectoryPathOrg1 = path.resolve(cryptoPathOrg1, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
// Path to org1 peer tls certificate.
exports.tlsCertPathOrg1 = path.resolve(cryptoPathOrg1, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
// Path to org2 crypto materials.
exports.cryptoPathOrg2 = path.resolve(__dirname, '..', '..', '..', 'modified-test-net', 'organizations', 'peerOrganizations', 'org2.example.com');
// Path to org2 user private key directory.
exports.keyDirectoryPathOrg2 = path.resolve(exports.cryptoPathOrg2, 'users', 'User1@org2.example.com', 'msp', 'keystore');
// Path to org2 user certificate.
exports.certDirectoryPathOrg2 = path.resolve(exports.cryptoPathOrg2, 'users', 'User1@org2.example.com', 'msp', 'signcerts');
// Path to org2 peer tls certificate.
exports.tlsCertPathOrg2 = path.resolve(exports.cryptoPathOrg2, 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
// Gateway peer endpoint.
exports.peerEndpointOrg1 = 'localhost:7051';
exports.peerEndpointOrg2 = 'localhost:9051';
// Gateway peer container name.
exports.peerNameOrg1 = 'peer0.org1.example.com';
exports.peerNameOrg2 = 'peer0.org2.example.com';
function newGrpcConnection(tlsCertPath, peerEndpoint, peerName) {
    return __awaiter(this, void 0, void 0, function () {
        var tlsRootCert, tlsCredentials;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.readFile(tlsCertPath)];
                case 1:
                    tlsRootCert = _a.sent();
                    tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
                    return [2 /*return*/, new grpc.Client(peerEndpoint, tlsCredentials, {
                            'grpc.ssl_target_name_override': peerName
                        })];
            }
        });
    });
}
exports.newGrpcConnection = newGrpcConnection;
function newIdentity(certDirectoryPath, mspId) {
    return __awaiter(this, void 0, void 0, function () {
        var certPath, credentials;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getFirstDirFileName(certDirectoryPath)];
                case 1:
                    certPath = _a.sent();
                    return [4 /*yield*/, fs_1.promises.readFile(certPath)];
                case 2:
                    credentials = _a.sent();
                    return [2 /*return*/, { mspId: mspId, credentials: credentials }];
            }
        });
    });
}
exports.newIdentity = newIdentity;
function newSigner(keyDirectoryPath) {
    return __awaiter(this, void 0, void 0, function () {
        var keyPath, privateKeyPem, privateKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getFirstDirFileName(keyDirectoryPath)];
                case 1:
                    keyPath = _a.sent();
                    return [4 /*yield*/, fs_1.promises.readFile(keyPath)];
                case 2:
                    privateKeyPem = _a.sent();
                    privateKey = crypto.createPrivateKey(privateKeyPem);
                    return [2 /*return*/, fabric_gateway_1.signers.newPrivateKeySigner(privateKey)];
            }
        });
    });
}
exports.newSigner = newSigner;
function getFirstDirFileName(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        var files, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.readdir(dirPath)];
                case 1:
                    files = _a.sent();
                    file = files[0];
                    if (!file) {
                        throw new Error("No files in directory: ".concat(dirPath));
                    }
                    return [2 /*return*/, path.join(dirPath, file)];
            }
        });
    });
}
