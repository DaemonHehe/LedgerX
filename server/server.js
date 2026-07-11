import dotenv from 'dotenv';
import app from './src/app.js';

dotenv.config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[LedgerX Server] Running on http://localhost:${port}`);
  console.log(`[LedgerX Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
