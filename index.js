import { createRequire } from "module";
const require = createRequire(import.meta.url);
const oceanlib = require("@oceanprotocol/lib")
const ethers = require("ethers");

import * as config from "./config.js";
import fs from "fs";

const provider = new ethers.providers.JsonRpcProvider(config.NETWORK_RPC);
const consumer = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider);

const chainId = parseInt(String((await provider.getNetwork()).chainId))
const oceanConfig = new oceanlib.ConfigHelper().getConfig(chainId);
const oceanAddresses = JSON.parse(fs.readFileSync(config.ADDRESS_FILE, "utf8"))[config.NETWORK_NAME];

const aquarius = new oceanlib.Aquarius(config.AQUARIUS_URL);

const asset = await aquarius.resolve(config.DID);
console.info(asset);

await oceanlib.approve(
    consumer,
    oceanConfig,
    consumer.address,
    oceanConfig.oceanTokenAddress,
    oceanConfig.fixedRateExchangeAddress,
    "100"
);

const initializeData = await oceanlib.ProviderInstance.initialize(
    asset.id,
    asset.services[0].id,
    0,
    consumer.address,
    oceanConfig.providerUri
);

const providerFees = {
    providerFeeAddress: initializeData.providerFee.providerFeeAddress,
    providerFeeToken: initializeData.providerFee.providerFeeToken,
    providerFeeAmount: initializeData.providerFee.providerFeeAmount,
    v: initializeData.providerFee.v,
    r: initializeData.providerFee.r,
    s: initializeData.providerFee.s,
    providerData: initializeData.providerFee.providerData,
    validUntil: initializeData.providerFee.validUntil,
};

const datatoken = new oceanlib.Datatoken(consumer);

const tx = await datatoken.startOrder(
    oceanConfig.fixedRateExchangeAddress,
    consumer.address,
    0,
    providerFees,
    null,
    null,
    ethers.BigNumber.from(100000)
);

const orderTx = await tx.wait();
const orderStartedTx = getEventFromTx(orderTx, "OrderStarted");

const downloadURL = await oceanlib.ProviderInstance.getDownloadUrl(
    asset.id,
    asset.services[0].id,
    0,
    orderTx.transactionHash,
    oceanConfig.providerUri,
    consumer
);
console.info({ 'downloadURL': downloadURL });
