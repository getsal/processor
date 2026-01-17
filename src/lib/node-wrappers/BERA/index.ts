import BlockchainWrapper from "../base";
import Web3 from 'web3';
import WebsocketProvider from 'web3-providers-ws';
import { Web3Bera } from './web3_extended';

/**
 * Berachain Node Wrapper
 * 
 * Based on ETH wrapper since Berachain is EVM-compatible.
 * Handles WebSocket connection to Berachain RPC and provides
 * transaction/block data retrieval methods.
 */
class BERAWrapper extends BlockchainWrapper {
    private wsProvider: WebsocketProvider | null = null;
    protected web3: Web3;
    private isHttp: boolean = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private lastBlockHeight: number = 0;

    constructor(host: string) {
        super('BERA');

        this.isHttp = host.startsWith('http');

        if (this.isHttp) {
            this.web3 = new Web3(new Web3.providers.HttpProvider(host));
        } else {
            // Initialize web3 with WebSocket provider
            const options = {
                clientConfig: {
                    maxReceivedFrameSize: 10000000000,
                    maxReceivedMessageSize: 10000000000,
                    keepalive: true,
                    keepaliveInterval: 1000,
                },
                reconnect: {
                    auto: true,
                    delay: 1000,
                    maxAttempts: Number.MAX_SAFE_INTEGER,
                    onTimeout: false
                }
            };
    
            this.wsProvider = new Web3.providers.WebsocketProvider(host, options);
            this.web3 = new Web3(this.wsProvider);
        }

        this.extendWeb3();
    }

    /**
     * Extend Web3 with txpool methods for mempool access
     */
    protected extendWeb3() {
        this.web3.eth.extend({
            property: 'txpool',
            methods: [
                { name: "status", call: "txpool_status" }
            ]
        });

        this.web3.eth.extend({
            methods: [
                { name: "newPendingTransactionFilter", call: "eth_newPendingTransactionFilter" },
                { name: "getFilterChanges", call: "eth_getFilterChanges", params: 1 }
            ]
        });
    }

    /**
     * Initialize event subscriptions for pending transactions and new blocks
     */
    public initEventSystem() {
        console.log(`BERA: Initializing event system (Mode: ${this.isHttp ? 'HTTP Polling' : 'WebSocket'})`);

        if (this.isHttp) {
            // HTTP Polling mode
            this.startPolling();
        } else {
            // WebSocket Subscription mode
            this.web3.eth.subscribe('pendingTransactions', (error: any, result: any) => { })
                .on('data', async (hash: string) => {
                    try {
                        const transaction = await this.getTransaction(hash, 2);
                        if (!transaction) return;
                        this.emit('mempool-tx', transaction);
                    } catch (error) {
                        console.error('BERA: Error processing pending tx:', error);
                    }
                });
    
            this.web3.eth.subscribe('newBlockHeaders', (error: any, result: any) => { })
                .on('data', (block: any) => {
                    this.emit('confirmed-block', block.hash);
                });
        }
    }

    /**
     * Poll for new blocks and pending transactions
     */
    private async startPolling() {
        // Poll for blocks every 2 seconds
        setInterval(async () => {
            try {
                const currentBlockNumber = await this.web3.eth.getBlockNumber();
                if (currentBlockNumber > this.lastBlockHeight) {
                    if (this.lastBlockHeight > 0) {
                        // Process missed blocks if any, up to a limit
                        const start = this.lastBlockHeight + 1;
                        for (let i = start; i <= currentBlockNumber; i++) {
                            try {
                                const block = await this.web3.eth.getBlock(i, false);
                                if (block && block.hash) {
                                  this.emit('confirmed-block', block.hash);
                                }
                            } catch (e) {
                                console.error(`BERA: Error fetching block ${i}:`, e);
                            }
                        }
                    } else {
                         // First run, just emit current
                         const block = await this.web3.eth.getBlock(currentBlockNumber, false);
                         if(block && block.hash) {
                            this.emit('confirmed-block', block.hash);
                         }
                    }
                    this.lastBlockHeight = currentBlockNumber;
                }
            } catch (error) {
                console.error('BERA: Polling error:', error);
            }
        }, 2000);

        // Initialize pending transaction filter
        let filterId: string | null = null;
        try {
            // @ts-ignore - Web3 type definitions might be incomplete
            filterId = await this.web3.eth.newPendingTransactionFilter();
            console.log("BERA: Pending Transaction Filter created:", filterId);
        } catch (e) {
            console.warn("BERA: Pending Tx filter not supported over HTTP:", e);
        }

        // Poll for pending transactions every 1 second
        setInterval(async () => {
            if (!filterId) {
                // Try to recreate filter if it failed initially or was lost
                try {
                    // @ts-ignore
                    filterId = await this.web3.eth.newPendingTransactionFilter();
                } catch (e) { return; }
            }

            try {
                // @ts-ignore
                const changes = await this.web3.eth.getFilterChanges(filterId);
                
                if (Array.isArray(changes) && changes.length > 0) {
                    // Limit processing to avoid overwhelming
                    const hashes = changes.slice(0, 50); 
                    
                    for (const hash of hashes) {
                        if (typeof hash === 'string') {
                            this.getTransaction(hash, 0)
                                .then(tx => {
                                    if (tx) this.emit('mempool-tx', tx);
                                })
                                .catch(e => { /* ignore tx fetch errors */ });
                        }
                    }
                }
            } catch (error: any) {
                console.error('BERA: Error polling pending txs:', error.message);
                // Reset filter ID on error (likely timeout or invalid)
                filterId = null;
            }
        }, 1000);
    }

    /**
     * Get current block height
     */
    public async getCurrentHeight(): Promise<null | number> {
        return await this.web3.eth.getBlockNumber();
    }

    /**
     * Get mempool size (pending + queued transactions)
     */
    public async mempoolSize(): Promise<number> {
        try {
            const status = await (this.web3 as Web3Bera).eth.txpool.status();
            return parseInt(status.pending) + parseInt(status.queued);
        } catch (error) {
            // Some RPC providers may not support txpool_status
            console.warn('BERA: txpool_status not available');
            return 0;
        }
    }

    /**
     * Get transaction receipts for all transactions in a block
     */
    public async getTransactionReceipts(block: any) {
        try {
            let promises = [];
            for (let i = 0; i < block.transactions.length; i++) {
                const transaction = block.transactions[i];
                promises.push(this.web3.eth.getTransactionReceipt(transaction.hash));
            }
            let receipts = await Promise.all(promises);
            return receipts;
        } catch (error) {
            console.error('BERA: Error getting transaction receipts:', error);
            return [];
        }
    };

    /**
     * Get a single transaction receipt
     */
    public async getTransactionReceipt(hash: string) {
        try {
            let receipt = await this.web3.eth.getTransactionReceipt(hash);
            return receipt;
        }
        catch (error) {
            console.error('BERA: Error getting transaction receipt:', error);
            return null;
        }
    }

    /**
     * Get transaction by hash with specified verbosity level
     */
    public async getTransaction(id: string, verbosity: number, blockId?: string | number): Promise<any> {
        try {
            const transaction: any = await this.web3.eth.getTransaction(id);
            if (!transaction) return null;
            if (typeof transaction === "string") return null;

            // Normalize addresses to lowercase
            if (transaction.from)
                transaction.from = transaction.from.toLowerCase();
            if (transaction.to)
                transaction.to = transaction.to.toLowerCase();

            // Convert BigInt/string values to numbers
            if (transaction.gasPrice)
                transaction.gasPrice = Number(transaction.gasPrice);
            if (transaction.v)
                transaction.v = Number(transaction.v);
            if (transaction.value)
                transaction.value = Number(transaction.value);
            if (transaction.maxPriorityFeePerGas)
                transaction.maxPriorityFeePerGas = Number(transaction.maxPriorityFeePerGas);
            if (transaction.maxFeePerGas)
                transaction.maxFeePerGas = Number(transaction.maxFeePerGas);

            // Calculate sort price for pending transactions
            transaction.pendingSortPrice = Number(transaction.gasPrice || transaction.maxFeePerGas);

            // Get receipt if verbosity > 0 and transaction is confirmed
            if (verbosity > 0 && transaction.blockHash) {
                transaction.receipt = await this.web3.eth.getTransactionReceipt(id);
            }
            return transaction;
        } catch (error: any) {
            const msg = error.message || error.toString();
            if (msg.includes("connection not open on send"))
                process.exit(1);
            console.error('BERA: Error getting transaction:', error);
            return null;
        }
    }

    /**
     * Get block by height or hash with specified verbosity level
     */
    public async getBlock(id: string | number, verbosity: number): Promise<any> {
        try {
            const returnTransactionObjects = verbosity > 0 ? true : false;
            let block: any;
            if (returnTransactionObjects) {
                block = await this.web3.eth.getBlock(id, true);
            } else {
                block = await this.web3.eth.getBlock(id, false);
            }
            if (!block) return null;

            block.height = block.number;
            block.baseFeePerGas = Number(block.baseFeePerGas);
            block.timestamp = Math.floor(block.timestamp);

            // Process transactions if included
            for (let i = 0; i < block.transactions?.length; i++) {
                const transaction = block.transactions[i];
                if (typeof transaction === "string") continue;

                if (transaction.from)
                    transaction.from = transaction.from.toLowerCase();
                if (transaction.to)
                    transaction.to = transaction.to.toLowerCase();

                if (transaction.gasPrice)
                    transaction.gasPrice = Number(transaction.gasPrice);
                if (transaction.v)
                    transaction.v = Number(transaction.v);
                if (transaction.value)
                    transaction.value = Number(transaction.value);
                if (transaction.maxPriorityFeePerGas)
                    transaction.maxPriorityFeePerGas = Number(transaction.maxPriorityFeePerGas);
                if (transaction.maxFeePerGas)
                    transaction.maxFeePerGas = Number(transaction.maxFeePerGas);

                transaction.pendingSortPrice = Number(transaction.gasPrice || transaction.maxFeePerGas);

                block.transactions[i] = transaction;
            }

            return block;
        } catch (error: any) {
            const msg = error.message || error.toString();
            if (msg.includes("connection not open on send"))
                process.exit(1);
            console.error('BERA: Error getting block:', error);
            return null;
        }
    }

    /**
     * Get contract code at address
     */
    public async getCode(address: string) {
        try {
            return await this.web3.eth.getCode(address);
        } catch (error) {
            console.error('BERA: Error getting code:', error);
            return "0x";
        }
    }

    /**
     * Resolve block data with existence check
     */
    public async resolveBlock(id: string | number, verbosity: number, depth: number): Promise<any> {
        try {
            const block = await this.getBlock(id, verbosity);
            if (!block)
                return { exists: false };
            if (block.height == null)
                return { exists: false };
            return { exists: true, block };
        } catch (error) {
            console.error('BERA: Error resolving block:', error);
            return { exists: false };
        }
    }

    /**
     * Get transaction count for an address
     */
    public async getTransactionCount(address: string): Promise<number> {
        try {
            return await this.web3.eth.getTransactionCount(address);
        } catch (error) {
            console.error('BERA: Error getting transaction count:', error);
            return 0;
        }
    }

    /**
     * Check if data represents a transaction
     */
    public isTransaction(data: any): boolean {
        if (!data.hash) return false;
        if (!data.gasPrice && !data.maxFeePerGas) return false;
        return true;
    }

    /**
     * Check if transaction is confirmed (has a block hash)
     */
    public isTransactionConfirmed(transaction: any): boolean {
        return transaction.blockHash != null;
    }

    /**
     * Check if data represents a block
     */
    public isBlock(data: any): boolean {
        if (!data.chain) return false;
        if (!data.hash) return false;
        if (!data.height) return false;
        return true;
    }

    /**
     * Check if error is a disconnect error
     */
    public isDisconnectError(err: Error): boolean {
        return (/connection not open on send/i.test(err.message));
    }

    /**
     * Stop the WebSocket connection
     */
    public async stop(): Promise<void> {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.wsProvider) {
            await this.wsProvider.disconnect();
        }
    }
};

export default BERAWrapper;
