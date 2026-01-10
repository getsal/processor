import mongodb from '../databases/mongodb';
import { storeObject } from '../lib/utilities';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const seedHouses = async () => {
    try {
        console.log("Connecting to MongoDB...");
        const { database, connection } = await mongodb();
        const collection = database.collection('houses');

        const chains = ['BERA', 'ETH']; // 対象チェーン

        for (const chain of chains) {
            console.log(`Processing chain: ${chain}`);
            // MongoDBからHouseを取得
            // donationなどの除外条件はフロントエンド側にあるが、念のため全て取得
            const houses = await collection.find({ chain: chain }).toArray();
            
            if (houses.length === 0) {
                console.log(`No houses found for ${chain}`);
                continue;
            }

            console.log(`Found ${houses.length} houses for ${chain}`);

            // Redis用のキー
            const redisKey = path.join('live', `houses-${chain}`);
            
            // JSON化して保存
            const content = JSON.stringify(houses);
            await storeObject(redisKey, content);
            
            console.log(`Saved to Redis key: ${redisKey}`);
        }

        console.log("Done.");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding houses:", error);
        process.exit(1);
    }
};

seedHouses();
