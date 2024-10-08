package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"google.golang.org/grpc"
)

const (
	channelName               = "channel1"
	chaincodeName             = "private"
	mspIdOrg1                 = "Org1MSP"
	mspIdOrg2                 = "Org2MSP"
	org1PrivateCollectionName = "Org1MSPPrivateCollection"
	org2PrivateCollectionName = "Org2MSPPrivateCollection"
	peerEndpointOrg1          = "localhost:7051"
	peerEndpointOrg2          = "localhost:9051"
	peerNameOrg1              = "peer0.org1.example.com"
	peerNameOrg2              = "peer0.org2.example.com"
	cryptoPathOrg1            = "../../../modified-test-net/organizations/peerOrganizations/org1.example.com"
	certDirectoryPathOrg1     = cryptoPathOrg1 + "/users/User1@org1.example.com/msp/signcerts"
	keyDirectoryPathOrg1      = cryptoPathOrg1 + "/users/User1@org1.example.com/msp/keystore"
	tlsCertPathOrg1           = cryptoPathOrg1 + "/peers/peer0.org1.example.com/tls/ca.crt"
	cryptoPathOrg2            = "../../../modified-test-net/organizations/peerOrganizations/org2.example.com"
	certDirectoryPathOrg2     = cryptoPathOrg2 + "/users/User1@org2.example.com/msp/signcerts"
	keyDirectoryPathOrg2      = cryptoPathOrg2 + "/users/User1@org2.example.com/msp/keystore"
	tlsCertPathOrg2           = cryptoPathOrg2 + "/peers/peer0.org2.example.com/tls/ca.crt"
	assetType                 = "ValuableAsset"
	red                       = "\x1b[31m\n"
	reset                     = "\x1b[0m"
)

var (
	now      = time.Now().Unix()
	assetID1 = fmt.Sprintf("asset%d", now)
	assetID2 = fmt.Sprintf("asset%d", now+1)
)

func main() {
	clientOrg1, err := newGrpcConnection(tlsCertPathOrg1, peerEndpointOrg1, peerNameOrg1)
	if err != nil {
		log.Fatalf("Failed to create gRPC connection for Org1: %v", err)
	}
	defer clientOrg1.Close()

	gatewayOrg1, err := client.Connect(client.Connection{
		Client:   clientOrg1,
		Identity: newIdentity(certDirectoryPathOrg1, mspIdOrg1),
		Signer:   newSigner(keyDirectoryPathOrg1),
	})
	if err != nil {
		log.Fatalf("Failed to connect gateway for Org1: %v", err)
	}
	defer gatewayOrg1.Close()

	clientOrg2, err := newGrpcConnection(tlsCertPathOrg2, peerEndpointOrg2, peerNameOrg2)
	if err != nil {
		log.Fatalf("Failed to create gRPC connection for Org2: %v", err)
	}
	defer clientOrg2.Close()

	gatewayOrg2, err := client.Connect(client.Connection{
		Client:   clientOrg2,
		Identity: newIdentity(certDirectoryPathOrg2, mspIdOrg2),
		Signer:   newSigner(keyDirectoryPathOrg2),
	})
	if err != nil {
		log.Fatalf("Failed to connect gateway for Org2: %v", err)
	}
	defer gatewayOrg2.Close()

	ctx := context.Background()

	// Get the smart contract as an Org1 client.
	contractOrg1 := gatewayOrg1.GetNetwork(channelName).GetContract(chaincodeName)

	// Get the smart contract as an Org2 client.
	contractOrg2 := gatewayOrg2.GetNetwork(channelName).GetContract(chaincodeName)

	log.Println("\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~")

	// Create new assets on the ledger.
	createAssets(ctx, contractOrg1)

	// Read asset from the Org1's private data collection with ID in the given range.
	getAssetsByRange(ctx, contractOrg1)

	// Attempt to transfer asset without prior approval from Org2, transaction expected to fail.
	log.Println("\nAttempt TransferAsset without prior AgreeToTransfer")
	if err := transferAsset(ctx, contractOrg1, assetID1); err == nil {
		doFail("TransferAsset transaction succeeded when it was expected to fail")
	} else {
		log.Println("*** Received expected error:", err)
	}

	log.Println("\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~")

	// Read the asset by ID.
	readAssetByID(ctx, contractOrg2, assetID1)

	// Make agreement to transfer the asset from Org1 to Org2.
	agreeToTransfer(ctx, contractOrg2, assetID1)

	log.Println("\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~")

	// Read transfer agreement.
	readTransferAgreement(ctx, contractOrg1, assetID1)

	// Transfer asset to Org2.
	transferAsset(ctx, contractOrg1, assetID1)

	// Again ReadAsset : results will show that the buyer identity now owns the asset.
	readAssetByID(ctx, contractOrg1, assetID1)

	// Confirm that transfer removed the private details from the Org1 collection.
	org1ReadSuccess := readAssetPrivateDetails(ctx, contractOrg1, assetID1, org1PrivateCollectionName)
	if org1ReadSuccess {
		doFail(fmt.Sprintf("Asset private data still exists in %s", org1PrivateCollectionName))
	}

	log.Println("\n~~~~~~~~~~~~~~~~ As Org2 Client ~~~~~~~~~~~~~~~~")

	// Org2 can read asset private details: Org2 is owner, and private details exist in new owner's Collection
	org2ReadSuccess := readAssetPrivateDetails(ctx, contractOrg2, assetID1, org2PrivateCollectionName)
	if !org2ReadSuccess {
		doFail(fmt.Sprintf("Asset private data not found in %s", org2PrivateCollectionName))
	}

	log.Println("\nAttempt DeleteAsset using non-owner organization")
	if err := deleteAsset(ctx, contractOrg2, assetID2); err == nil {
		doFail("DeleteAsset transaction succeeded when it was expected to fail")
	} else {
		log.Println("*** Received expected error:", err)
	}

	log.Println("\n~~~~~~~~~~~~~~~~ As Org1 Client ~~~~~~~~~~~~~~~~")

	// Delete AssetID2 as Org1.
	deleteAsset(ctx, contractOrg1, assetID2)

	// Trigger a purge of the private data for the asset
	// The previous delete is optional if purge is used
	purgeAsset(ctx, contractOrg1, assetID2)
}

func newGrpcConnection(tlsCertPath, peerEndpoint, peerName string) (*grpc.ClientConn, error) {
	// Implement the gRPC connection logic
	// ...
	return nil, nil
}

func newIdentity(certDirectoryPath, mspId string) client.Identity {
	// Implement identity creation logic
	// ...
	return client.Identity{}
}

func newSigner(keyDirectoryPath string) client.Signer {
	// Implement signer creation logic
	// ...
	return nil
}

func createAssets(ctx context.Context, contract *client.Contract) {
	log.Printf("\n--> Submit Transaction: CreateAsset, ID: %s", assetID1)

	asset1Data := map[string]interface{}{
		"objectType":     assetType,
		"assetID":        assetID1,
		"color":          "green",
		"size":           20,
		"appraisedValue": 100,
	}

	transientData, _ := json.Marshal(asset1Data)
	_, err := contract.SubmitTransaction("CreateAsset", client.WithTransientData(map[string][]byte{"asset_properties": transientData}))
	if err != nil {
		doFail(fmt.Sprintf("Failed to create asset %s: %v", assetID1, err))
	}

	log.Println("*** Transaction committed successfully")

	log.Printf("\n--> Submit Transaction: CreateAsset, ID: %s", assetID2)

	asset2Data := map[string]interface{}{
		"objectType":     assetType,
		"assetID":        assetID2,
		"color":          "blue",
		"size":           35,
		"appraisedValue": 727,
	}

	transientData, _ = json.Marshal(asset2Data)
	_, err = contract.SubmitTransaction("CreateAsset", client.WithTransientData(map[string][]byte{"asset_properties": transientData}))
	if err != nil {
		doFail(fmt.Sprintf("Failed to create asset %s: %v", assetID2, err))
	}

	log.Println("*** Transaction committed successfully")
}

func getAssetsByRange(ctx context.Context, contract *client.Contract) {
	log.Printf("\n--> Evaluate Transaction: ReadAssetPrivateDetails from %s", org1PrivateCollectionName)

	resultBytes, err := contract.EvaluateTransaction("GetAssetByRange", assetID1, fmt.Sprintf("asset%d", now+2))
	if err != nil {
		doFail(fmt.Sprintf("Failed to get assets by range: %v", err))
	}

	if len(resultBytes) == 0 {
		doFail("Received empty query list for readAssetPrivateDetailsOrg1")
	}

	var result interface{}
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		doFail(fmt.Sprintf("Failed to parse result: %v", err))
	}
	log.Println("*** Result:", result)
}

func readAssetByID(ctx context.Context, contract *client.Contract, assetID string) {
	log.Printf("\n--> Evaluate Transaction: ReadAsset, ID: %s", assetID)
	resultBytes, err := contract.EvaluateTransaction("ReadAsset", assetID)
	if err != nil {
		doFail(fmt.Sprintf("Failed to read asset by ID: %v", err))
	}

	if len(resultBytes) == 0 {
		doFail("Received empty result for ReadAsset")
	}

	var result interface{}
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		doFail(fmt.Sprintf("Failed to parse result: %v", err))
	}
	log.Println("*** Result:", result)
}

func agreeToTransfer(ctx context.Context, contract *client.Contract, assetID string) {
	dataForAgreement := map[string]interface{}{
		"assetID":        assetID,
		"appraisedValue": 100,
	}
	log.Printf("\n--> Submit Transaction: AgreeToTransfer, payload: %v", dataForAgreement)

	transientData, _ := json.Marshal(dataForAgreement)
	_, err := contract.Submit("AgreeToTransfer", client.WithTransient(transientData))
	if err != nil {
		doFail(fmt.Sprintf("Failed to agree to transfer: %v", err))
	}

	log.Println("*** Transaction committed successfully")
}

func readTransferAgreement(ctx context.Context, contract *client.Contract, assetID string) {
	log.Printf("\n--> Evaluate Transaction: ReadTransferAgreement, ID: %s", assetID)

	resultBytes, err := contract.EvaluateTransaction("ReadTransferAgreement", assetID)
	if err != nil {
		doFail(fmt.Sprintf("Failed to read transfer agreement: %v", err))
	}

	if len(resultBytes) == 0 {
		doFail("Received no result for ReadTransferAgreement")
	}

	var result interface{}
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		doFail(fmt.Sprintf("Failed to parse result: %v", err))
	}
	log.Println("*** Result:", result)
}

func transferAsset(ctx context.Context, contract *client.Contract, assetID string) error {
	log.Printf("\n--> Submit Transaction: TransferAsset, ID: %s", assetID)

	buyerDetails := map[string]interface{}{
		"assetID":  assetID,
		"buyerMSP": mspIdOrg2,
	}

	transientData, _ := json.Marshal(buyerDetails)
	_, err := contract.Submit("TransferAsset", client.WithTransient(transientData))
	if err != nil {
		return fmt.Errorf("failed to transfer asset: %v", err)
	}

	log.Println("*** Transaction committed successfully")
	return nil
}

func deleteAsset(ctx context.Context, contract *client.Contract, assetID string) error {
	log.Printf("\n--> Submit Transaction: DeleteAsset, ID: %s", assetID)
	dataForDelete := map[string]interface{}{
		"assetID": assetID,
	}

	transientData, _ := json.Marshal(dataForDelete)
	_, err := contract.Submit("DeleteAsset", client.WithTransient(transientData))
	if err != nil {
		return fmt.Errorf("failed to delete asset: %v", err)
	}

	log.Println("*** Transaction committed successfully")
	return nil
}

func purgeAsset(ctx context.Context, contract *client.Contract, assetID string) {
	log.Printf("\n--> Submit Transaction: PurgeAsset, ID: %s", assetID)
	dataForPurge := map[string]interface{}{
		"assetID": assetID,
	}

	transientData, _ := json.Marshal(dataForPurge)
	_, err := contract.Submit("PurgeAsset", client.WithTransient(transientData))
	if err != nil {
		doFail(fmt.Sprintf("Failed to purge asset: %v", err))
	}

	log.Println("*** Transaction committed successfully")
}

func readAssetPrivateDetails(ctx context.Context, contract *client.Contract, assetID string, collectionName string) bool {
	log.Printf("\n--> Evaluate Transaction: ReadAssetPrivateDetails from %s, ID: %s", collectionName, assetID)

	resultBytes, err := contract.EvaluateTransaction("ReadAssetPrivateDetails", collectionName, assetID)
	if err != nil {
		log.Printf("*** Failed to read asset private details: %v", err)
		return false
	}

	if len(resultBytes) == 0 {
		log.Println("*** No result")
		return false
	}

	var result interface{}
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		doFail(fmt.Sprintf("Failed to parse result: %v", err))
	}
	log.Println("*** Result:", result)
	return true
}

func doFail(msgString string) {
	fmt.Printf("%s\t%s%s\n", red, msgString, reset)
	log.Fatalf("%s", msgString)
}

func getFirstDirFileName(dirPath string) (string, error) {
	files, err := os.ReadDir(dirPath)
	if err != nil {
		return "", fmt.Errorf("failed to read directory: %v", err)
	}
	if len(files) == 0 {
		return "", fmt.Errorf("no files in directory: %s", dirPath)
	}
	return filepath.Join(dirPath, files[0].Name()), nil
}
