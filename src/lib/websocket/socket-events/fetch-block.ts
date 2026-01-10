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

    const block = await readNFSFile(`blocks/${chain}/${hash}`);
    if (block) return socket.emit('fetch-block', hash, null, block);

    return socket.emit('fetch-block', hash, 'Block not found 2', null);
}




