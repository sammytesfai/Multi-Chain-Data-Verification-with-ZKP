#!/bin/bash

2>&1
set -x

./network.sh down -numorgs 6
sleep 1

./network.sh up -numorgs 6 -ca -s couchdb
./network.sh createChannel -c channel1 -org1 1 -org2 2

export PATH=$PATH:/usr/local/go/bin

./network.sh deployCC -ccn private -ccp ../asset-transfer-private-data/chaincode-typescript/ -ccl typescript -ccep "OR('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer','Org4MSP.peer','Org5MSP.peer','Org6MSP.peer')" -cccg ../asset-transfer-private-data/chaincode-typescript/collections_config.json  -c channel1 -org1 1 -org2 2