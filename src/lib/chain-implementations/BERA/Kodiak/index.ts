import ChainImplementation from '../../implementation';
import { decRound } from '../../../../lib/utilities';
// @ts-ignore-line
import abiDecoder from 'abi-decoder';
import tokenManager from "../../../../lib/utilities/tokenManager";
import mongodb from '../../../../databases/mongodb';

/**
 * Kodiak DEX Implementation for Berachain
 * Handles swap and liquidity transactions on Kodiak
 */

// Kodiak Router ABI (simplified for common swap functions)
const KODIAK_ROUTER_ABI = [
    {
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForTokens",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactETHForTokens",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForETH",
        "type": "function"
    }
];

// BERA native token (wrapped) - Mainnet address
const WBERA_ADDRESS = "0x6969696969696969696969696969696969696969";

const getToken = async (kodiak: Kodiak, address: string) => {
    const tokenInfo = await kodiak.tokenManager.getToken(address);
    return tokenInfo;
}

const tknSymbol = (token: any) => {
    if (!token || !token.symbol) return "???";
    // Replace WBERA with BERA for display
    return token.address?.toLowerCase() === WBERA_ADDRESS.toLowerCase() ? "BERA" : token.symbol;
}

const swapPart = (token: any, amount: number, transaction: any) => {
    if (!token || !amount) return "???";
    const fullAmount = amount / Math.pow(10, token.decimals || 18);
    // Show bubble for large BERA swaps
    if (token.address?.toLowerCase() === WBERA_ADDRESS.toLowerCase() && fullAmount >= 100) {
        transaction.extras.showBubble = true;
    }
    return decRound(fullAmount) + " " + tknSymbol(token);
}

const swap = async (kodiak: Kodiak, address1: string, amount1: number, address2: string, amount2: number, transaction: any) => {
    const token1 = await getToken(kodiak, address1);
    const token2 = await getToken(kodiak, address2);

    const inSwap = swapPart(token1, amount1, transaction);
    const outSwap = swapPart(token2, amount2, transaction);
    let message = inSwap + " ➞ " + outSwap;
    if (message.includes("e-")) return false;
    if (message.includes("???")) transaction.extras.showBubble = false;
    
    transaction.extras.erc20Swap = {
        from: {
            token: address1,
            amount: Number(amount1)
        },
        to: {
            token: address2,
            amount: Number(amount2)
        }
    }
    transaction.extras.houseContent = message;
    return message;
}

const getData = async (kodiak: Kodiak, transaction: any): Promise<string | boolean> => {
    try {
        if (!kodiak.addresses.includes(transaction.to.toLowerCase()) || !transaction.input) return false;
        const decoded: any = abiDecoder.decodeMethod(transaction.input);
        if (!decoded || !decoded.name) return false;

        if (decoded.name === "swapExactTokensForTokens" ||
            decoded.name === "swapExactTokensForETH" ||
            decoded.name === "swapExactTokensForETHSupportingFeeOnTransferTokens" ||
            decoded.name === "swapExactTokensForTokensSupportingFeeOnTransferTokens") {
            const pathIndex = decoded.params.findIndex((p: any) => p.name === "path");
            const path = decoded.params[pathIndex]?.value || [];
            const address1 = path[0];
            const amount1 = decoded.params[0].value;
            const address2 = path[path.length - 1];
            const amount2 = decoded.params[1].value;

            return await swap(kodiak, address1, amount1, address2, amount2, transaction);
        } else if (decoded.name === "swapExactETHForTokens" ||
            decoded.name === "swapETHForExactTokens" ||
            decoded.name === "swapExactETHForTokensSupportingFeeOnTransferTokens") {
            const pathIndex = decoded.params.findIndex((p: any) => p.name === "path");
            const path = decoded.params[pathIndex]?.value || [];
            const address1 = path[0];
            const amount1 = transaction.value;
            const address2 = path[path.length - 1];
            const amount2 = decoded.params[0].value;

            return await swap(kodiak, address1, amount1, address2, amount2, transaction);
        } else if (decoded.name.includes("addLiquidity")) {
            transaction.extras.houseContent = "Added Liquidity 🍯";
        } else if (decoded.name.includes("removeLiquidity")) {
            transaction.extras.houseContent = "Removed Liquidity";
        }
        return true;
    } catch (error) {
        return false;
    }
}

class Kodiak extends ChainImplementation {
    public addresses: string[] = [];
    public tokenManager: any;

    async init(): Promise<ChainImplementation> {
        try {
            if (process.env.USE_DATABASE === "false")
                return this;
            const { database } = await mongodb();
            const collection = database.collection('houses');
            const result = await collection.findOne({ chain: this.chain, name: "kodiak" });
            
            if (result && result.contracts) {
                for (let i = 0; i < result.contracts.length; i++) {
                    result.contracts[i] = result.contracts[i].toLowerCase();
                }
                this.addresses = result.contracts;
            }

            abiDecoder.addABI(KODIAK_ROUTER_ABI);
            this.tokenManager = new tokenManager('BERA');

            console.log('BERA: initialized Kodiak DEX');
        } catch (error) {
            console.error("BERA Kodiak init error:", error);
        } finally {
            return this;
        }
    }

    async validate(transaction: any): Promise<boolean> {
        if (!transaction.to) return false;
        return this.addresses.includes(transaction.to.toLowerCase());
    }

    async execute(transaction: any): Promise<boolean> {
        if (transaction.house === "kodiak") return true;
        transaction.house = 'kodiak';
        if (!transaction.extras) transaction.extras = {};
        const data = await getData(this, transaction);
        if (data && !transaction?.extras?.showBubble) {
            transaction.extras.showBubble = false;
        }
        return true;
    }
}

export default new Kodiak("BERA");
