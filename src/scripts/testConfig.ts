import { runConfigTest } from '../tests/configTest';
import { closeConnection } from '@/services/dbService';

const main = async () => {
  try {
    await runConfigTest();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
};

main(); 