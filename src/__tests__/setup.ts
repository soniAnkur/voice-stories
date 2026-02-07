import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Test logger for debugging
export const testLog = {
  info: (message: string, data?: unknown) => {
    console.log(`\n[INFO] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  success: (message: string, data?: unknown) => {
    console.log(`\n[SUCCESS] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  error: (message: string, error?: unknown) => {
    console.error(`\n[ERROR] ${message}`);
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else if (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  },
  step: (step: number, message: string) => {
    console.log(`\n  Step ${step}: ${message}`);
  },
  result: (label: string, value: unknown) => {
    console.log(`    ${label}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  },
};

// Increase timeout for integration tests
jest.setTimeout(60000);
