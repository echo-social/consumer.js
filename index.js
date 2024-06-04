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
const datatokenAddress = asset.datatokens[0].address;
console.info(asset);

await oceanlib.approve(
    consumer,
    oceanConfig,
    consumer.address,
    oceanConfig.oceanTokenAddress,
    oceanConfig.fixedRateExchangeAddress,
    "10000"
);

var axios = require('axios');

const queryFixedRateExchanges = `{
  fixedRateExchanges(subgraphError:deny){
    id
    contract
    exchangeId
    owner{id}
    datatoken{
      id
      name
      symbol
    }
    price
    datatokenBalance
    active
    totalSwapValue
    swaps(skip:0, first:1){
      tx
      by {
        id
      }
      baseTokenAmount
      dataTokenAmount
      createdTimestamp
    }
    updates(skip:0, first:1){
      oldPrice
      newPrice
      newActive
      createdTimestamp
      tx
    }
  }
}`

const axiosConfig = {
    method: 'post',
    url: `https://indexer.echo-social.io/subgraphs/name/oceanprotocol/ocean-subgraph`,
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ "query": queryFixedRateExchanges })
};

// TODO: filter on server (does not seem to work)
const axiosResponse = await axios(axiosConfig);
let fixedRateExchangeInfo = axiosResponse.data.data.fixedRateExchanges.find(
    function (el) {
        return el.datatoken.id.toLowerCase() == datatokenAddress.toLowerCase();
    });
const exchangeId = fixedRateExchangeInfo.exchangeId
console.info(exchangeId);

// Swap base token for DT token
const fixedRate = new oceanlib.FixedRateExchange(oceanConfig.fixedRateExchangeAddress, consumer)
await fixedRate.buyDatatokens(exchangeId, '1', '150')


var consumerOCEANBalance = await oceanlib.balance(
    consumer,
    oceanConfig.oceanTokenAddress,
    await consumer.getAddress()
)
console.info(`Consumer base token balance after swap: ${consumerOCEANBalance}`)
var consumerDTBalance = await oceanlib.balance(
    consumer,
    datatokenAddress,
    await consumer.getAddress()
)
console.info(`Consumer DT token balance after swap: ${consumerDTBalance}`)


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
    datatokenAddress,
    consumer.address,
    0,
    providerFees,
    null,
    null,
    ethers.BigNumber.from(10000000)
);

const orderTx = await tx.wait();
const orderStartedTx = oceanlib.getEventFromTx(orderTx, "OrderStarted");

const downloadURL = await oceanlib.ProviderInstance.getDownloadUrl(
    asset.id,
    asset.services[0].id,
    0,
    orderTx.transactionHash,
    oceanConfig.providerUri,
    consumer
);
console.info({ 'downloadURL': downloadURL });
