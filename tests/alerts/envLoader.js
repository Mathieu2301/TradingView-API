const fs = require('fs');

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n') // LF
    .forEach((l) => {
      const s = l.split('=');
      // eslint-disable-next-line
      if (s[1]) process.env[s[0]] = s[1];
    });
}
