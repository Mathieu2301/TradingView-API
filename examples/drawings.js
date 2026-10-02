// Drawings of a saved layout (the ID in tradingview.com/chart/<ID>/).
// Private layouts need credentials and your user ID (see examples/user-login.js).
// Run: npm run build && node --env-file=.env examples/drawings.js <layoutId> [userId]
import { getDrawings } from '@mathieuc/tradingview';

const [layoutId, userId] = process.argv.slice(2);
if (!layoutId) throw new Error('Please specify a layout ID');

const drawings = await getDrawings(layoutId, {
  credentials: process.env.SESSION ? { session: process.env.SESSION, signature: process.env.SIGNATURE } : undefined,
  userId: userId ? Number(userId) : undefined,
});

console.log(`Found ${drawings.length} drawings:`, drawings.map((d) => ({
  id: d.id, symbol: d.symbol, type: d.type, text: d.state?.text,
})));
