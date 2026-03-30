import { Pool } from 'pg';

const maxAttempts = 10;
const delayMs = 3000;

async function waitForDatabase(): Promise<void> {
  console.log(`Attempting to connect to database (max ${maxAttempts} attempts, ${delayMs}ms delay)...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      const client = await pool.connect();
      console.log(`✓ Database connection successful on attempt ${attempt}`);
      await client.release();
      await pool.end();
      return;
    } catch (error) {
      console.log(`✗ Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs}ms...`);
      if (attempt === maxAttempts) {
        console.error('✗ Failed to connect to database after maximum attempts');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

waitForDatabase();
