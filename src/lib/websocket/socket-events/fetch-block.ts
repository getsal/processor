import SocketIO from 'socket.io';
import { readNFSFile } from '../../utilities';
import { lastBlocksFull } from '../redis/handlers/block';

export default async (socket: SocketIO.Socket, chain: string, hash: string) => {
    if(!lastBlocksFull[chain])
        return socket.emit('fetch-block', hash, 'Block not found', null);

    for (let i = 0; i < lastBlocksFull[chain].length; i++) {
        const lastBlock = lastBlocksFull[chain][i];
        if(lastBlock.hash === hash)
            return socket.emit('fetch-block', hash, null, lastBlock);
    }

    const blockStr = await readNFSFile(`blocks/${chain}/${hash}`);
    if (blockStr) {
        try {
            const block = JSON.parse(blockStr);
            return socket.emit('fetch-block', hash, null, block);
        } catch (e) {
            return socket.emit('fetch-block', hash, 'Failed to parse block', null);
        }
    }

    return socket.emit('fetch-block', hash, 'Block not found 2', null);
}




