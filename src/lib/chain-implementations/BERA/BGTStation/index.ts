import ChainImplementation from '../../implementation';
import mongodb from '../../../../databases/mongodb';

/**
 * BGT Station / PoL Implementation for Berachain
 * Handles BGT governance, delegation, and Proof of Liquidity transactions
 */

class BGTStation extends ChainImplementation {
    public addresses: string[] = [];
    public bgtContracts: { [address: string]: string } = {};

    async init(): Promise<ChainImplementation> {
        try {
            if (process.env.USE_DATABASE === "false")
                return this;
            const { database } = await mongodb();
            const collection = database.collection('houses');
            const result = await collection.findOne({ chain: this.chain, name: "bgtstation" });
            
            if (result && result.contracts) {
                for (let i = 0; i < result.contracts.length; i++) {
                    const addr = result.contracts[i].toLowerCase();
                    this.addresses.push(addr);
                    this.bgtContracts[addr] = result.contractNames?.[i] || "BGT Station";
                }
            }

            console.log('BERA: initialized BGT Station');
        } catch (error) {
            console.error("BERA BGTStation init error:", error);
        } finally {
            return this;
        }
    }

    async validate(transaction: any): Promise<boolean> {
        if (!transaction.to) return false;
        return this.addresses.includes(transaction.to.toLowerCase());
    }

    async execute(transaction: any): Promise<boolean> {
        transaction.house = 'bgtstation';
        if (!transaction.extras) transaction.extras = {};
        
        // Parse common BGT actions from input data
        const input = transaction.input?.toLowerCase() || "";
        
        if (input.includes("delegate")) {
            transaction.extras.houseContent = "Delegated BGT 🐻";
        } else if (input.includes("boost")) {
            transaction.extras.houseContent = "Boosted Validator ⚡";
        } else if (input.includes("claim")) {
            transaction.extras.houseContent = "Claimed BGT 🍯";
        } else if (input.includes("stake")) {
            transaction.extras.houseContent = "Staked in PoL 🔒";
        } else if (input.includes("withdraw")) {
            transaction.extras.houseContent = "Withdrew from PoL";
        } else {
            transaction.extras.houseContent = "BGT Station Action";
        }
        
        return true;
    }
}

export default new BGTStation("BERA");
