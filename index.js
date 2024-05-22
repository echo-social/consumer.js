import { createRequire } from "module";
const require = createRequire(import.meta.url);
const oceanlib = require("@oceanprotocol/lib")
const ethers = require("ethers");

import * as config from "./config.js";
import fs from "fs";

const ethersProvider = new ethers.JsonRpcProvider(config.NETWORK_RPC);
const consumerAccount = new ethers.Wallet(config.WALLET_PRIVATE_KEY, ethersProvider);

const chainId = parseInt(String((await ethersProvider.getNetwork()).chainId))
const oceanConfig = new oceanlib.ConfigHelper().getConfig(chainId);
const oceanAddresses = JSON.parse(fs.readFileSync(config.ADDRESS_FILE, "utf8"))[config.NETWORK_NAME];

const aquarius = new oceanlib.Aquarius(config.AQUARIUS_URL);

const asset = await aquarius.resolve(config.DID);
console.info(asset);

await oceanlib.approve(
    consumerAccount,
    oceanConfig,
    consumerAccount.address,
    oceanConfig.oceanTokenAddress,
    oceanConfig.fixedRateExchangeAddress,
    "100"
);
