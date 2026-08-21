import db from './src/config/db'; // adjust path if needed

async function main() {
  const rows = await db('organizations').select('*');

  console.table(rows);

  await db.destroy();
}

main().catch(console.error);