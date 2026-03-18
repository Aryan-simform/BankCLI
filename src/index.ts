import { activeAccount, closeReadline, handleAccountMenu, handleMainMenu } from "./cli.js";

async function run() {
  console.log(`\n  Welcome to Fake Bank\n`);
  let running = true;

  while (running) {
    if (activeAccount === null) {
      running = await handleMainMenu();
    } else {
      await handleAccountMenu();
    }
  }

  console.log("\n  Thank you for banking with Fake Bank. Goodbye!\n");
  closeReadline();
}

run().catch(console.error);