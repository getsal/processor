import ChainImplementation from '../../implementation';
import mongodb from '../../../../databases/mongodb';

/**
 * Infrared Implementation for Berachain
 * Handles liquid staking and iBGT related transactions
 */

class Infrared extends ChainImplementation {
    public addresses: string[] = [];

    async init(): Promise<ChainImplementation> {
        try {
            if (process.env.USE_DATABASE === "false")
                return this;
            const { database } = await mongodb();
            const collection = database.collection('houses');
            const result = await collection.findOne({ chain: this.chain, name: "infrared" });
            
            if (result && result.contracts) {
                for (let i = 0; i < result.contracts.length; i++) {
                    this.addresses.push(result.contracts[i].toLowerCase());
                }
            }

            console.log('BERA: initialized Infrared');
        } catch (error) {
            console.error("BERA Infrared init error:", error);
        } finally {
            return this;
        }
    }

    async validate(transaction: any): Promise<boolean> {
        if (!transaction.to) return false;
        return this.addresses.includes(transaction.to.toLowerCase());
    }

    async execute(transaction: any): Promise<boolean> {
        transaction.house = 'infrared';
        if (!transaction.extras) transaction.extras = {};
        
        // Parse common Infrared actions from input data
        const input = transaction.input?.toLowerCase() || "";
        
        if (input.includes("deposit") || input.includes("stake")) {
            transaction.extras.houseContent = "Staked → iBGT 🔥";
            transaction.extras.showBubble = true;
        } else if (input.includes("withdraw") || input.includes("unstake")) {
            transaction.extras.houseContent = "Unstaked iBGT";
        } else if (input.includes("claim")) {
            transaction.extras.houseContent = "Claimed Rewards 🎁";
        } else if (input.includes("compound")) {
            transaction.extras.houseContent = "Compounded Rewards 🔄";
        } else {
            transaction.extras.houseContent = "Infrared Action";
        }
        
        return true;
    }
}

export default new Infrared("BERA");
