#!/bin/bash

for i in $(seq 1 20);
do
    original_dir=$(pwd)

    circom circuit.circom --r1cs --wasm --sym --c --output zkp_files

    cd zkp_files

    snarkjs groth16 setup circuit.r1cs ../pot12_final.ptau circuit_0000.zkey

    echo "one" | snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="First Contributor" -v

    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

    cd $original_dir

    npm install
    timeout 90 npm start
done