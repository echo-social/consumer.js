# consumer.js

The main purpose of this repository is to provide an example of how to buy Oceanprotocol datasets published on [Taraxa](https://www.taraxa.io) using JS.
You can find the market UI for the [Oceanprotocol stack](https://oceanprotocol.com/) at [market.echo-social](https://market.echo-social.io/).

# Environment vars
This project uses the following environment variables:

| Name | Description | Default Value | Example |
| ---- | ----------- | ------------- | ------- |
| NETWORK_RPC            | Network RPC           | None      | https://rpc.mainnet.taraxa.io |
| AQUARIUS_URL           | Aquarius URL          | None      | https://aquarius.echo-social.io |
| SUBGRAPH_URL           | Subgraph URL          | None      | https://indexer.echo-social.io/subgraphs/name/oceanprotocol/ocean-subgraph |
| ADDRESS_FILE           | Oceanprotocol contract addresses          | None      | ./address.json |
| WALLET_PRIVATE_KEY     | Buyer wallet private key         | None      | 0x... |
| DID                    | Document ID to buy | None | did:op:... |


# Pre-requisites
- Install [Node.js](https://nodejs.org/en/)


# Getting started
- Clone the repository
```
git clone https://github.com/echo-social/consumer.js.git consumer.js
```
- Install dependencies
```
cd consumer.js
npm install
```
- Configure env vars

For example,
```
cp .env.testnet .env
```

And then specify the wallet private key and the document id.

- Build and run the project
```
node --env-file=.env src/index.js
```

## Project Structure
The folder structure of this app is explained below:

| Name | Description |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **node_modules**         | Contains all  npm dependencies                                                            |
| **src**/index.js         | Entry point                                                           |
| **src**/address.json         | Taraxa testnet and mainet oceanprotocol contracts addresses  |
| package.json             | Contains npm dependencies
