const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createBeraStats() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DATABASE);
  
  // Create initial statistics for BERA
  const stats = {
    chain: 'BERA',
    tps: 0,
    ctps: 0,
    baseFee: 1000000000,
    'mempool-size': 0,
    'medianFee-usd': 0,
    'medianFee-usdTransfer': 0,
    'medianFee-gasPrice': 0,
    'supply-circulating': 0,
    'fiatPrice-usd': 0,
    lastBlock: 0,
    medianTxsPerBlock: 0,
    gasLimit: 30000000,
    gasTarget: 15000000,
    medianGasUsed: 0,
    medianBlockSize: 0,
    gasUsedDif: 100,
    medianBlockTime: 0,
    blockHeight: 0,
    'marketCap-usd': 0,
    'volume-usd': 0
  };
  
  await db.collection('statistics').updateOne(
    { chain: 'BERA' },
    { $set: stats },
    { upsert: true }
  );
  
  // Create nohistory version too
  await db.collection('statistics').updateOne(
    { chain: 'BERA-nohistory' },
    { $set: { ...stats, chain: 'BERA-nohistory' } },
    { upsert: true }
  );
  
  console.log('BERA statistics created!');
  await client.close();
}

createBeraStats().catch(console.error);
