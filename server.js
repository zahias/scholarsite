require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  require('./dist/index.js');
} else {
  console.log('Development mode - use npm run dev instead');
  process.exit(1);
}
