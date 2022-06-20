#!/bin/bash

cd circuits/shipment-verifier

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    curl https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau -o powersOfTau28_hez_final_10.ptau
fi

echo "Compiling shipment-verifier.circom..."

# compile circuit

circom shipment-verifier.circom --r1cs --wasm --sym -o .
snarkjs r1cs info shipment-verifier.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup shipment-verifier.r1cs powersOfTau28_hez_final_10.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="The Fibers" -v -e="One small step for man."
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey ./shipment-verifier.sol

cd ../..