# ZKP_MASTERMIND

This project implements the classic Mastermind game using Zero-Knowledge Proofs (ZKPs). The goal is to prove that a guess matches a secret code according to Mastermind rules, without revealing the secret itself. The circuit is written in Circom, and proofs are generated and verified using the PLONK proving system. All proof generation and verification are handled locally in plain JavaScript.

## Features

- Mastermind logic implemented as a Circom circuit
- Secret is never revealed; only the validity of the guess is proven
- PLONK used for proof generation and verification
- Full local workflow (no blockchain required)
- Proof verification implemented in JavaScript

## Requirements

Before running the project, make sure the following tools and libraries are installed:

- [Node.js](https://nodejs.org/)
- [Circom](https://docs.circom.io/getting-started/installation/)
- [snarkjs](https://github.com/iden3/snarkjs)

Install required npm packages:

```bash
npm install circomlibjs
npm install circomlib
