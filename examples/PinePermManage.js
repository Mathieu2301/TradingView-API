const { PinePermManager } = require('../main');

/**
 * This example creates a pine permission manager
 * and tests all the available functions
 */

const sessionid = process.argv[2];
const signature = process.argv[3];
const pineid = process.argv[4];

const manager = new PinePermManager(sessionid, signature, pineid);

(async () => {
  console.log('Users:', await manager.getUsers());

  console.log('Adding user \'TradingView\'...');

  switch (await manager.addUser('TradingView')) {
    case 'ok':
      console.log('Done !');
      break;
    case 'exists':
      console.log('This user is already authorized');
      break;
    default:
      console.error('Unknown error...');
      break;
  }

  console.log('Users:', await manager.getUsers());

  console.log('Modifying expiration date...');

  const newDate = new Date(Date.now() + 24 * 3600000); // Add one day
  if (await manager.modifyExpiration('TradingView', newDate) === 'ok') {
    console.log('Done !');
  } else console.error('Unknown error...');

  console.log('Users:', await manager.getUsers());

  console.log('Removing expiration date...');

  if (await manager.modifyExpiration('TradingView') === 'ok') {
    console.log('Done !');
  } else console.error('Unknown error...');

  console.log('Users:', await manager.getUsers());

  console.log('Removing user \'TradingView\'...');

  if (await manager.removeUser('TradingView') === 'ok') {
    console.log('Done !');
  } else console.error('Unknown error...');

  console.log('Users:', await manager.getUsers());
})();
