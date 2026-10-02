// Manage who can use an invite-only script you own.
// Run: npm run build && node --env-file=.env examples/pine-permissions.js <PUB;pineId>
import { PinePermissionManager } from '@mathieuc/tradingview';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');
const pineId = process.argv[2];
if (!pineId) throw new Error('Please specify a Pine ID as first argument');

const manager = new PinePermissionManager(pineId, {
  credentials: { session: process.env.SESSION, signature: process.env.SIGNATURE },
});

console.log('Users:', await manager.getUsers());
console.log("Adding 'TradingView':", await manager.addUser('TradingView')); // 'ok' or 'exists'
console.log('Expiring tomorrow:', await manager.modifyExpiration('TradingView', new Date(Date.now() + 86_400_000)));
console.log('Removing expiration:', await manager.modifyExpiration('TradingView'));
console.log('Removing user:', await manager.removeUser('TradingView'));
console.log('Users:', await manager.getUsers());
