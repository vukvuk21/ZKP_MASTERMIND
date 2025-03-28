circom circuits/masterMind.circom --r1cs --wasm -o build

snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v --entropy="1234567890asdfghjkl"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

snarkjs plonk setup build/masterMind.r1cs pot12_final.ptau build/masterMind.zkey
snarkjs zkey export verificationkey build/masterMind.zkey build/verification_key.json
