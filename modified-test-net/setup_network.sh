#!/bin/bash

2>&1
set -x

# ./network.sh down -numorgs 3
# sleep 1

# ./network.sh up -numorgs 3
# ./network.sh createChannel -c channel1 -org1 1 -org2 2
# ./network.sh createChannel -c channel2 -org1 1 -org2 3

# export PATH=$PATH:/usr/local/go/bin

# ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go -c channel1 -org1 1 -org2 2
# ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go -c channel2 -org1 1 -org2 3
# sleep 5
# (
# cd ../asset-transfer-basic/application-gateway-go/ || exit
# go build assetTransfer.go
# sleep 1
# ./assetTransfer
# )

./network.sh down -numorgs 3
sleep 1

./network.sh up -numorgs 3 -ca -s couchdb
./network.sh createChannel -c channel1 -org1 1 -org2 2
# ./network.sh createChannel -c channel2 -org1 1 -org2 3

export PATH=$PATH:/usr/local/go/bin

./network.sh deployCC -ccn private -ccp ../asset-transfer-private-data/chaincode-typescript/ -ccl typescript -ccep "OR('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')" -cccg ../asset-transfer-private-data/chaincode-typescript/collections_config.json  -c channel1 -org1 1 -org2 2
# ./network.sh deployCC -ccn private -ccp ../asset-transfer-private-data/chaincode-typescript/ -ccl typescript -ccep "OR('Org1MSP.peer','Org3MSP.peer')" -cccg ../asset-transfer-private-data/chaincode-go/collections_config.json  -c channel2 -org1 1 -org2 3