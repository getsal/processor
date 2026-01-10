// @ts-strict-ignore
// Load environment variables from .env
import dotenv from 'dotenv';
dotenv.config(); 

// Misc imports 
import { BERAWrapper, BlockchainWrapper } from '../lib/node-wrappers/evm-only';
import processPendingTransactions from '../methods/tx-processor/process-pending-transactions'; 
import processConfirmedTransactions from '../methods/tx-processor/process-confirmed-transactions';
import config from '../lib/utilities/config';
import { startServer as startHealthcheckServer } from '../lib/healthcheck';

const nodesToInit = config.mustEnabledChains();
console.log({nodesToInit});

// Non event-blocking infinite loop for processPending
const processPending = async (wrapper: BERAWrapper) => {
    try {
        await processPendingTransactions(wrapper); 
    } catch (error) {
        console.error(error);
    } finally {
        process.nextTick(() => processPending(wrapper));
    }
}

// Non event-blocking infinite loop for processConfirmed
const processConfirmed = async (wrapper: BERAWrapper) => {
    try {
        await processConfirmedTransactions(wrapper); 
    } catch (error) {
        console.error(error);
    } finally {
        process.nextTick(() => processConfirmed(wrapper));
    }
}

// Async runner.
const run = async () => {
    if(nodesToInit.includes('BERA')) {
        console.log('Initializing BERA wrapper...');
        const beraWrapper = new BERAWrapper(process.env.BERA_NODE as string);
        
        if(process.env.PROCESS_PENDING == "true") {
            console.log('Starting pending transaction processor for BERA');
            processPending(beraWrapper);
        }
        if(process.env.PROCESS_CONFIRMED == "true") {
            console.log('Starting confirmed transaction processor for BERA');
            processConfirmed(beraWrapper);
        }
    } else {
        console.log('BERA not in enabled chains. Check TICKERS in .env');
    }
}

startHealthcheckServer();
run();
