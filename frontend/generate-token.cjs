const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { sub: 'driver@cargolink.ma' },
  'CargoLinkDevSecretKey2026AtLeast32Chars!',
  { expiresIn: '1h' }
);
console.log(token);
