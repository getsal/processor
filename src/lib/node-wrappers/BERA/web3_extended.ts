import Web3 from 'web3';
import Eth from 'web3-eth';

/**
 * Extended Web3 interfaces for Berachain
 * Berachain uses standard EVM txpool methods
 */

interface Web3Bera extends Web3 {
  eth: EthBera;
}

interface EthBera extends Eth {
  txpool: TxpoolBera;
};

interface TxpoolBera {
  status(): Promise<TxpoolStatus>;
};

// Standard txpool_status response
type TxpoolStatus = {
  pending: string; // Hex
  queued: string;  // Hex
};

export {
  Web3Bera,
};
