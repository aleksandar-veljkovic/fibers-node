#!/bin/bash

cd circuits/public-validation

if [ -f ./powersOfTau28_hez_final_14.ptau ]; then
    echo "powersOfTau28_hez_final_14.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_14.ptau'
    curl https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau -o powersOfTau28_hez_final_14.ptau
fi

echo "Compiling public-validation.circom..."

# compile circuit

circom public-validation.circom --r1cs --wasm --sym -o .
snarkjs r1cs info public-validation.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup public-validation.r1cs powersOfTau28_hez_final_14.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="The Fibers" -v -e="One small step for man."
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey ./public-validation-verifier.sol

cd ../..