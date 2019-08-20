const account = 'initminer'
const memo_key = '5JKVA1RMufcDpprpWmRsNVrkJtb3m3E8VbRUHdsVxC9CRxii2Z4'
const posting_key = '5JKVA1RMufcDpprpWmRsNVrkJtb3m3E8VbRUHdsVxC9CRxii2Z4'
const active_key = '5JKVA1RMufcDpprpWmRsNVrkJtb3m3E8VbRUHdsVxC9CRxii2Z4'

const LOOK_ACCOUNTS = [
  'iospace.tech',
  'inova.technology',
  'softspace.exp',
  'smart.geo.system',
  'smart.santinel',
  'geo.raw.tech',
  'greenplanet.tech',
  'sea.tech.plus',
  'ceospace',
  'eoalert.sys',
  'space.grid',
  'sat.data.system',
  'synotech'
]
const DERIVE_PRIVATE_KEYS = true

const secret_create_account = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

const database = 'univ'
const publicRoot = '../dist'

const config = {
  'production': {
    RPC_NODES : [
      'https://api.eftg.eu',
      'https://rpc-italy.eftg.eu',
      'https://rpc-germany.eftg.eu',
      'https://rpc-luxembourg.eftg.eu',
      'https://rpc-romania.eftg.eu'
    ],
    IMAGE_HOSTER : 'https://cdn.eftg.eu',
    ELASTIC : 'https://api.eftg.eu/pulsar/',
    CDN : 'https://cdn.eftg.eu/',
    SERVER_API: '/api/',
    EFTG_HARDFORK_0_1 : false
  },
  'acceptance': {
    RPC_NODES : [
      'https://api.blkcc.xyz'
    ],
    IMAGE_HOSTER : 'https://cdn.acc.blkcc.xyz',
    ELASTIC : 'https://api.blkcc.xyz/pulsar/',
    CDN : 'https://cdn.acc.blkcc.xyz/',
    SERVER_API: 'http://40.113.101.44:8084/api/',
    EFTG_HARDFORK_0_1 : false
  },
  'development': {
    RPC_NODES : [
      'https://apidev.blkcc.xyz',
    ],
    IMAGE_HOSTER : 'https://cdn.dev.blkcc.xyz',
    ELASTIC : 'https://apidev.blkcc.xyz/pulsar/',
    CDN : 'https://cdn.dev.blkcc.xyz/',
    SERVER_API: 'http://pulsar.dev.blkcc.xyz:8084/api/',
    EFTG_HARDFORK_0_1 : true
  }
}

const environment = process.env.NODE_ENV || 'development';
const finalConfig = config[environment];

const SBD = 'EUR';
const STEEM = 'PULSE';
const SP = 'PULSE-Power';
const VESTS = 'VESTS';

const HARDFORK = 19

const EXPLORER = '/explorer/'
const DSTEEM_TIMEOUT = 5000 //ms

const STEEM_ADDRESS_PREFIX = 'EUR';
const STEEM_100_PERCENT = 10000;
const STEEM_VOTE_REGENERATION_SECONDS = 5 * 24 * 60 * 60;
const STEEM_INFLATION_RATE_START_PERCENT = 978;
const STEEM_INFLATION_NARROWING_PERIOD = 250000;
const STEEM_INFLATION_RATE_STOP_PERCENT = 95;
const STEEM_BLOCKS_PER_YEAR = (365 * 24 * 60 * 60) / 3;
const STEEM_BLOCKS_PER_DAY = (24 * 60 * 60) / 3;
const STEEM_SBD_START_PERCENT = 900;
const STEEM_SBD_STOP_PERCENT = 1000;
const STEEM_CHAIN_ID = '07c687c01f134adaf217a9b9367d1cef679c3c020167fdd25ee8c403f687528e'

const MAP = {
  TOP_WITNESSES: 30,
  INI_POS : [50.5, 15], //latitude, longitude
  INI_ZOOM : 4 ,
}

const CONFIRMATION_PAYMENT_ID_NAME = 'confirmation_payment'
const STATE_FILE = 'state.json'

const APP_VERSION = 'pulsar/1.5.3';

const ACCOUNT_CREATION_FEE = '3.000 PULSE'

const final_account       = process.env.ACCOUNT       || account
const final_memo_key      = process.env.MEMO_KEY      || memo_key
const final_posting_key   = process.env.POSTING_KEY   || posting_key
const final_active_key    = process.env.ACTIVE_KEY    || active_key

const final_secret_create_account = process.env.SECRET_CREATE_ACCOUNT || secret_create_account
const final_database = process.env.DATABASE || database
const final_publicRoot = process.env.PUBLIC_ROOT || publicRoot

module.exports = {

  RPC_NODES: finalConfig.RPC_NODES,
  IMAGE_HOSTER: finalConfig.IMAGE_HOSTER,
  ELASTIC: finalConfig.ELASTIC,
  CDN: finalConfig.CDN,
  SERVER_API: finalConfig.SERVER_API,
  
  SBD: SBD,
  STEEM: STEEM,
  SP: SP,
  VESTS: VESTS,
  HARDFORK: HARDFORK,
  
  EFTG_HARDFORK_0_1: finalConfig.EFTG_HARDFORK_0_1,

  EXPLORER,
  DSTEEM_TIMEOUT,

  STEEM_ADDRESS_PREFIX: STEEM_ADDRESS_PREFIX,
  STEEM_100_PERCENT: STEEM_100_PERCENT,
  STEEM_VOTE_REGENERATION_SECONDS: STEEM_VOTE_REGENERATION_SECONDS,
  STEEM_INFLATION_RATE_START_PERCENT: STEEM_INFLATION_RATE_START_PERCENT,
  STEEM_INFLATION_NARROWING_PERIOD: STEEM_INFLATION_NARROWING_PERIOD,
  STEEM_INFLATION_RATE_STOP_PERCENT: STEEM_INFLATION_RATE_STOP_PERCENT,
  STEEM_BLOCKS_PER_YEAR: STEEM_BLOCKS_PER_YEAR,
  STEEM_BLOCKS_PER_DAY: STEEM_BLOCKS_PER_DAY,
  STEEM_SBD_START_PERCENT: STEEM_SBD_START_PERCENT,
  STEEM_SBD_STOP_PERCENT: STEEM_SBD_STOP_PERCENT,
  STEEM_CHAIN_ID,

  MAP:MAP,

  APP_VERSION: APP_VERSION,
  ACCOUNT_CREATION_FEE,
  CONFIRMATION_PAYMENT_ID_NAME,
  STATE_FILE,

  ACCOUNT: final_account,
  MEMO_KEY: final_memo_key,
  POSTING_KEY: final_posting_key,
  ACTIVE_KEY: final_active_key,
  SECRET_CREATE_ACCOUNT: final_secret_create_account,
  DATABASE: final_database,
  PUBLIC_ROOT: final_publicRoot,

  LOOK_ACCOUNTS,
  DERIVE_PRIVATE_KEYS,
};
