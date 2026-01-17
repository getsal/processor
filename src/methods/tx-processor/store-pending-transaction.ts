import { BlockchainWrapper } from '../../lib/node-wrappers';
import mongodb from '../../databases/mongodb';
import redis from '../../databases/redisEvents';
import { formatTransaction, storeObject } from '../../lib/utilities';

const updatePendingListFile = async (wrapper: BlockchainWrapper) => {
    try {
        const { database } = await mongodb();
        const collection = database.collection('transactions_' + wrapper.ticker || '');
        
        // Find transactions that are not in a block yet (mempool)
        // Sort by insertion time descending to show newest first
        const pendingTxs = await collection.find({ 
            blockHash: null,
            // Optimization: Only get recently processed ones if needed, but for now get all pending
        })
        .sort({ insertedAt: -1 })
        .limit(500)
        .toArray();

        const formatted = pendingTxs.map((tx: any) => formatTransaction(wrapper.ticker, tx));
        
        // Save to Redis key expected by API (live/pendingTxs-CHAIN)
        await storeObject(`live/pendingTxs-${wrapper.ticker}`, JSON.stringify(formatted));
    } catch (e) {
        console.error("Error updating pending list file:", e);
    }
}

// Simple throttle mechanism
const lastUpdates: {[chain: string]: number} = {};

export default async (wrapper: BlockchainWrapper, transactions: any[]): Promise<boolean> => {
    try {
        // Initialize the database.
        const { database } = await mongodb();
        const collection = database.collection('transactions_' + wrapper.ticker || ''); 
        
        // Create an array of instructions for the database. 
        const instructions: any[] = [];

        // Iterate over the transactions to create the bulkWrite instructions. 
        transactions.forEach((transaction: any) => {
            redis.publish('pendingTx', JSON.stringify({ chain: wrapper.ticker, ...formatTransaction(wrapper.ticker, transaction) }));
            instructions.push({
                updateOne: {
                    filter: { hash: transaction.hash }, 
                    update: {
                        $set: { ...transaction, locked: false, processed: true, processFailures: 0, lastProcessed: Date.now(), insertedAt: new Date(), lastInsert: new Date(), note: '[txp]: store-pending-tx' },
                    }
                }
            })
        });

        // Wait for the query to complete.
        if(instructions.length > 0)
            await collection.bulkWrite(instructions, { ordered: false });

        // Update the pending list JSON file (throttled to once per second per chain)
        const now = Date.now();
        if (!lastUpdates[wrapper.ticker] || now - lastUpdates[wrapper.ticker] > 1000) {
            lastUpdates[wrapper.ticker] = now;
            // Run in background / don't await to avoid blocking processing
            updatePendingListFile(wrapper).catch(err => console.error(err));
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}