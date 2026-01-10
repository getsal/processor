/**
 * Seed Berachain Houses Data to MongoDB
 * 
 * This script populates the MongoDB 'houses' collection with Berachain
 * protocol data for transaction visualization in BeraStreet.
 * 
 * Usage: npx ts-node scripts/seed-bera-houses.ts
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import {
  BERA_CONTRACTS,
  KODIAK_CONTRACTS,
  INFRARED_CONTRACTS,
  BEX_CONTRACTS,
  BERADROME_CONTRACTS,
  HONEY_CONTRACTS,
  NFT_CONTRACTS,
} from '../src/lib/chain-implementations/BERA/contracts';

// Load environment variables
dotenv.config();

interface HouseData {
  name: string;
  chain: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  contracts: string[];
  priority: number;
  popupLength: number;
  side: number;
  dataSources: string[];
  website?: string;
  twitter?: string;
}

// Define Berachain houses
const BERA_HOUSES: HouseData[] = [
  // Core Berachain Infrastructure
  {
    name: "berachain",
    chain: "BERA",
    title: "Berachain",
    description: "Core Berachain infrastructure including BGT staking, block rewards, and protocol mechanics.",
    icon: "berachain",
    color: "#F5A623",
    contracts: [
      BERA_CONTRACTS.BGT.toLowerCase(),
      BERA_CONTRACTS.HONEY.toLowerCase(),
      BERA_CONTRACTS.WBERA.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.BEACON_DEPOSIT.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.BGT_STAKER.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.FEE_COLLECTOR.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.REWARD_VAULT_FACTORY.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.DISTRIBUTOR.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.BERACHEF.toLowerCase(),
    ],
    priority: 100,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://berachain.com",
    twitter: "https://twitter.com/beaboracles",
  },

  // BGT Station
  {
    name: "bgtstation",
    chain: "BERA",
    title: "BGT Station",
    description: "BGT Station for staking, delegation, and governance participation.",
    icon: "bgtstation",
    color: "#FFD700",
    contracts: [
      BERA_CONTRACTS.BERACHAIN.BGT_STAKER.toLowerCase(),
      BERA_CONTRACTS.BERACHAIN.BERACHEF.toLowerCase(),
    ],
    priority: 95,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://hub.berachain.com/",
  },

  // Kodiak DEX
  {
    name: "kodiak",
    chain: "BERA",
    title: "Kodiak",
    description: "Kodiak is Berachain's native concentrated liquidity DEX with Islands and xKDK staking.",
    icon: "kodiak",
    color: "#00B4D8",
    contracts: KODIAK_CONTRACTS,
    priority: 90,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://kodiak.finance",
    twitter: "https://twitter.com/KodiakFi",
  },

  // BEX (Native DEX)
  {
    name: "bex",
    chain: "BERA",
    title: "BEX",
    description: "BEX is Berachain's native decentralized exchange built on proof-of-liquidity mechanics.",
    icon: "bex",
    color: "#8B5CF6",
    contracts: BEX_CONTRACTS,
    priority: 85,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://hub.berachain.com/",
  },

  // Infrared
  {
    name: "infrared",
    chain: "BERA",
    title: "Infrared",
    description: "Infrared is a liquid staking protocol for Berachain offering iBGT and iBERA.",
    icon: "infrared",
    color: "#EF4444",
    contracts: INFRARED_CONTRACTS,
    priority: 80,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://infrared.finance",
    twitter: "https://twitter.com/InfraredFinance",
  },

  // Beradrome
  {
    name: "beradrome",
    chain: "BERA",
    title: "Beradrome",
    description: "Beradrome is a ve(3,3) DEX and liquidity layer for Berachain ecosystem.",
    icon: "beradrome",
    color: "#10B981",
    contracts: BERADROME_CONTRACTS,
    priority: 75,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://beradrome.com",
    twitter: "https://twitter.com/beaboracles",
  },

  // Honey
  {
    name: "honey",
    chain: "BERA",
    title: "Honey",
    description: "HONEY is Berachain's native stablecoin, minted through the Honey protocol.",
    icon: "honey",
    color: "#FFC107",
    contracts: HONEY_CONTRACTS,
    priority: 70,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://hub.berachain.com/",
  },

  // SushiSwap
  {
    name: "sushiswap",
    chain: "BERA",
    title: "SushiSwap",
    description: "SushiSwap is a multi-chain DEX with advanced trading features on Berachain.",
    icon: "sushi",
    color: "#FF6B6B",
    contracts: [
      BERA_CONTRACTS.SUSHISWAP.ROUTE_PROCESSOR_7.toLowerCase(),
      BERA_CONTRACTS.SUSHISWAP.ROUTE_PROCESSOR_9.toLowerCase(),
      BERA_CONTRACTS.SUSHISWAP.RED_SNWAPPER.toLowerCase(),
    ],
    priority: 65,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://sushi.com",
    twitter: "https://twitter.com/SushiSwap",
  },

  // Dolomite
  {
    name: "dolomite",
    chain: "BERA",
    title: "Dolomite",
    description: "Dolomite is a decentralized money market and margin trading protocol on Berachain.",
    icon: "dolomite",
    color: "#6366F1",
    contracts: [
      BERA_CONTRACTS.DOLOMITE.DOLO.toLowerCase(),
      BERA_CONTRACTS.DOLOMITE.dWBERA.toLowerCase(),
      BERA_CONTRACTS.DOLOMITE.dHONEY.toLowerCase(),
      BERA_CONTRACTS.DOLOMITE.drUSD.toLowerCase(),
      BERA_CONTRACTS.DOLOMITE.veDOLO.toLowerCase(),
    ],
    priority: 60,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://dolomite.io",
    twitter: "https://twitter.com/Dolomite_io",
  },

  // Yearn
  {
    name: "yearn",
    chain: "BERA",
    title: "Yearn",
    description: "Yearn Finance yield aggregator on Berachain with yBERA and yHONEY vaults.",
    icon: "yearn",
    color: "#0066FF",
    contracts: [
      BERA_CONTRACTS.YEARN.yBERA.toLowerCase(),
      BERA_CONTRACTS.YEARN.yHONEY.toLowerCase(),
      BERA_CONTRACTS.YEARN.yBGT.toLowerCase(),
    ],
    priority: 55,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://yearn.fi",
    twitter: "https://twitter.com/yeaboracles",
  },

  // Pendle
  {
    name: "pendle",
    chain: "BERA",
    title: "Pendle",
    description: "Pendle is a yield trading protocol enabling trading of future yield on Berachain.",
    icon: "pendle",
    color: "#00D395",
    contracts: [
      BERA_CONTRACTS.PENDLE.PENDLE_TOKEN.toLowerCase(),
    ],
    priority: 50,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
    website: "https://pendle.finance",
    twitter: "https://twitter.com/penaboracles",
  },

  // NFT Marketplaces & Collections
  {
    name: "nft",
    chain: "BERA",
    title: "NFT",
    description: "NFT collections on Berachain including Mibera, Bullas, and Steady Teddys.",
    icon: "nft",
    color: "#EC4899",
    contracts: NFT_CONTRACTS,
    priority: 40,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
  },

  // Origami
  {
    name: "origami",
    chain: "BERA",
    title: "Origami",
    description: "Origami provides liquid staking solutions for OHM and BGT on Berachain.",
    icon: "origami",
    color: "#4ADE80",
    contracts: [
      BERA_CONTRACTS.ORIGAMI.oriBGT.toLowerCase(),
    ],
    priority: 45,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
  },

  // BeraPaw
  {
    name: "berapaw",
    chain: "BERA",
    title: "BeraPaw",
    description: "BeraPaw provides liquid BGT (LBGT) and pBERA on Berachain.",
    icon: "berapaw",
    color: "#F59E0B",
    contracts: [
      BERA_CONTRACTS.BERAPAW.LBGT.toLowerCase(),
      BERA_CONTRACTS.BERAPAW.pBERA.toLowerCase(),
    ],
    priority: 43,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
  },

  // Euler
  {
    name: "euler",
    chain: "BERA",
    title: "Euler",
    description: "Euler is a non-custodial lending protocol on Berachain.",
    icon: "euler",
    color: "#8B5CF6",
    contracts: [
      BERA_CONTRACTS.EULER.EUL.toLowerCase(),
      BERA_CONTRACTS.EULER.rEUL.toLowerCase(),
    ],
    priority: 42,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
  },

  // Lair
  {
    name: "lair",
    chain: "BERA",
    title: "Lair",
    description: "Lair protocol on Berachain.",
    icon: "lair",
    color: "#6B7280",
    contracts: [
      BERA_CONTRACTS.LAIR.LAIR.toLowerCase(),
    ],
    priority: 41,
    popupLength: 75,
    side: 0,
    dataSources: ['script'],
  },
];

async function seedBeraHouses(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DATABASE || 'txstreet';

  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is not set');
    console.log('Please create processor/.env file with:');
    console.log('  MONGODB_URI=mongodb+srv://...');
    console.log('  MONGODB_DATABASE=txstreet');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const database = client.db(mongoDb);
    const collection = database.collection('houses');

    console.log(`\nSeeding ${BERA_HOUSES.length} Berachain houses...`);

    // Use bulkWrite for efficient upserts
    const writeOperations = BERA_HOUSES.map(house => ({
      updateOne: {
        filter: { name: house.name, chain: house.chain },
        update: { $set: house },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(writeOperations);

    console.log('\n=== Seed Results ===');
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Upserted: ${result.upsertedCount}`);

    // Verify the data
    const beraHouses = await collection.find({ chain: 'BERA' }).toArray();
    console.log(`\nTotal BERA houses in database: ${beraHouses.length}`);
    
    console.log('\nHouses list:');
    beraHouses
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach((house, index) => {
        console.log(`  ${index + 1}. ${house.title} (${house.name}) - Priority: ${house.priority}, Contracts: ${house.contracts?.length || 0}`);
      });

    console.log('\n✅ Berachain houses seeded successfully!');

  } catch (error) {
    console.error('Error seeding houses:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
seedBeraHouses();
