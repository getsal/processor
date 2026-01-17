
import path from 'path';
import { Worker } from 'worker_threads';
import BERAPendingList from '../../../containers/BERAPendingList';

export default async () => {
    const keys = Object.keys(process.env);
    const workerData: any = { }; 
    keys.forEach((key: string) => workerData[key] = process.env[key]); 

    try {
        console.log('Starting...');
        const pendingTxList = new BERAPendingList(); 
        await pendingTxList.init();

        // reuse ETH logic for these if possible, otherwise we might need to duplicate them too
        // For now, let's assume we can reuse the logic but point to BERA data
        // Actually, looking at ETH/workers/index.ts, they spawn workers. 
        // We need to make sure the workers we spawn also exist. 
        // 'calculateStats.js' will be our new BERA one.
        // 'mempoolInfo.js', 'broadcastReadyBlocks.js', 'calcGasEstimates.js' - we might need these too or reuse ETH ones if they are generic enough.
        // But for "missing stats", calculateStats is the most important one.
        
        // Since we are compiling TS to JS, we need to point to the .js files that WILL be generated.
        // The previous implementation plan only mentioned calculateStats.ts.
        // Let's spawn calculateStats.js.
        
        new Worker(path.join(__dirname, 'calculateStats.js'), { workerData });
        
        // If we need mempool info (mempool size etc), we might need mempoolInfo.js too. 
        // Let's check if we can reuse ETH's or need a new one.
        // For now, let's start with calculateStats.js which seems to be the main stats generator.

    } catch (error) {
        console.error(error); 
    }
}
