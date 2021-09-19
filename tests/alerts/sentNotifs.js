const fs = require('fs');

const sentNotifsFile = './sentNotifs.txt';

exports.getSentNotifs = () => {
  if (!fs.existsSync(sentNotifsFile)) fs.writeFileSync(sentNotifsFile, '');
  return (fs.readFileSync(sentNotifsFile, 'utf8') || '').split(';').filter((n) => n);
};

exports.addSentNotifs = (notif = '') => {
  if (!fs.existsSync(sentNotifsFile)) fs.writeFileSync(sentNotifsFile, '');
  fs.writeFileSync(
    sentNotifsFile,
    `${fs.readFileSync(sentNotifsFile, 'utf8') || ''}${notif};`,
  );
};
