import { createRequire } from "module";
const require = createRequire(import.meta.url);
const oceanlib = require("@oceanprotocol/lib")
const ethers = require("ethers");
const axios = require('axios');

const NETWORK_RPC = process.env.NETWORK_RPC;
const AQUARIUS_URL = process.env.AQUARIUS_URL;
const SUBGRAPH_URL = process.env.SUBGRAPH_URL;
const DID = process.env.DID;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC);

const consumer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

const chainId = parseInt(String((await provider.getNetwork()).chainId))
const oceanConfig = new oceanlib.ConfigHelper().getConfig(chainId);

const aquarius = new oceanlib.Aquarius(AQUARIUS_URL);

const asset = await aquarius.resolve(DID);
const datatokenAddress = asset.datatokens[0].address;
console.info({ 'asset': asset });

/* Approve the token first */
await oceanlib.approve(
  consumer,
  oceanConfig,
  consumer.address,
  oceanConfig.oceanTokenAddress,
  oceanConfig.fixedRateExchangeAddress,
  "10000"
);

/* Find the exchange id in order to swap base token to dataset token */
/* TODO: use server filter */

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
  url: SUBGRAPH_URL,
  headers: { "Content-Type": "application/json" },
  data: JSON.stringify({ "query": queryFixedRateExchanges })
};

const axiosResponse = await axios(axiosConfig);
let fixedRateExchangeInfo = axiosResponse.data.data.fixedRateExchanges.find(
  function (el) {
    return el.datatoken.id.toLowerCase() == datatokenAddress.toLowerCase();
  });
const exchangeId = fixedRateExchangeInfo.exchangeId
console.info({ 'exchangeId': exchangeId });

/* Swap base token for DT token */
const fixedRate = new oceanlib.FixedRateExchange(oceanConfig.fixedRateExchangeAddress, consumer);
const maxBasedTokens = '150';
await fixedRate.buyDatatokens(exchangeId, '1', maxBasedTokens)

/* Check the balances */
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

/* Configure fees */
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

/* Submit order */
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

/* Get the download URL */
const downloadURL = await oceanlib.ProviderInstance.getDownloadUrl(
  asset.id,
  asset.services[0].id,
  0,
  orderTx.transactionHash,
  oceanConfig.providerUri,
  consumer
);
console.info({ 'downloadURL': downloadURL });
