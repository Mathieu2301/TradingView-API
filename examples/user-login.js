// Sign in to get session cookies (accounts with 2FA/captcha are not supported).
// Never commit or share the printed cookies.
// Run: npm run build && node examples/user-login.js <username/email> <password>
import { getUser, loginUser } from '@mathieuc/tradingview';

const [username, password] = process.argv.slice(2);
if (!username || !password) throw new Error('Usage: node examples/user-login.js <username/email> <password>');

const user = await loginUser({ username, password, remember: false });
console.log('Signed in as', user.username, `(id ${user.id})`);
console.log('Put these in .env as SESSION and SIGNATURE:', { session: user.session, signature: user.signature });

// Later, the account can be loaded from the cookies alone:
const again = await getUser({ session: user.session, signature: user.signature });
console.log('Reloaded', again.username);
