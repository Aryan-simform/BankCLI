import * as readline from "readline";
import { Bank } from "./Bank.js";
import { BankAccount } from "./BankAccount.js";
import type { ITransaction, SortOrder } from "./types.js";
import { TransactionType } from "./types.js";
import { sortBy } from "./utils.js";

// ─── readline Setup ───────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export function closeReadline() {
  rl.close();
}

// ─── Print Helpers ────────────────────────────────────────────────────────────

export function printDivider() {
  console.log("─".repeat(52));
}

export function printTransaction(txn: ITransaction, index: number) {
  const sign = txn.type === TransactionType.DEPOSIT ? "+" : "-";
  console.log(
    `  [${index + 1}] ${txn.type.padEnd(12)} ${sign}Rs.${txn.amount.toFixed(2).padStart(10)}  Balance: Rs.${txn.balanceAfter.toFixed(2)}`
  );
  if (txn.description !== undefined) console.log(`       ${txn.description}`);
  console.log(`       ${txn.timestamp.toLocaleString()}  |  ${txn.id}`);
}

// ─── App State ────────────────────────────────────────────────────────────────

export const bank = new Bank<BankAccount>("Bank");
export let activeAccount: BankAccount | null = null;

// ─── Main Menu ────────────────────────────────────────────────────────────────

export async function handleMainMenu(): Promise<boolean> {
  printDivider();
  console.log(`  ${bank.name}`);
  printDivider();
  console.log("  1. Create account");
  console.log("  2. Login to account");
  console.log("  3. List all accounts");
  console.log("  4. Transfer between accounts");
  console.log("  0. Exit");
  printDivider();

  const choice = await prompt("  Choose: ");

  if (choice.trim() === "0") return false;

  const mainMenuActions: Record<string, () => Promise<void>> = {
    "1": async () => {
      const name       = await prompt("  Owner name: ");
      const depositStr = await prompt("  Initial deposit (press Enter to skip): ");
      const initial    = parseFloat(depositStr);
      const acc        = new BankAccount(name.trim(), isNaN(initial) ? undefined : initial);
      bank.addAccount(acc);
      console.log(`\n  Account created: ${acc.accountNumber}\n`);
    },

    "2": async () => {
      const id  = await prompt("  Account number: ");
      const acc = bank.findAccount(id.trim());
      if (acc !== undefined) {
        activeAccount = acc;
        console.log(`\n  Logged in as ${acc.owner}\n`);
      } else {
        console.log(`\n  Account not found\n`);
      }
    },

    "3": async () => {
      const accounts = bank.getAllAccounts();
      if (accounts.length === 0) {
        console.log("\n  No accounts yet.\n");
      } else {
        console.log("\n  All Accounts:");
        accounts.forEach((a) =>
          console.log(
            `  ${a.accountNumber}  ${a.owner.padEnd(20)}  Rs.${a.getBalance().toFixed(2).padStart(10)}  [${a.status}]`
          )
        );
        console.log(`\n  Total deposits: Rs.${bank.getTotalDeposits().toFixed(2)}\n`);
      }
    },

    "4": async () => {
      const from = await prompt("  From account number: ");
      const to   = await prompt("  To account number: ");
      const amt  = parseFloat(await prompt("  Amount: "));
      try {
        bank.transfer(from.trim(), to.trim(), amt);
        console.log(`\n  Transferred Rs.${amt} from ${from.trim()} to ${to.trim()}\n`);
      } catch (e) {
        console.log(`\n  Error: ${e instanceof Error ? e.message : e}\n`);
      }
    },
  };

  // noUncheckedIndexedAccess: action could be undefined, must check before calling
  const action = mainMenuActions[choice.trim()];
  if (action !== undefined) {
    await action();
  } else {
    console.log("\n  Invalid option.\n");
  }

  return true;
}

// ─── Account Menu ─────────────────────────────────────────────────────────────

export async function handleAccountMenu(): Promise<void> {
  printDivider();
  console.log(`  ${activeAccount!.owner}  |  ${activeAccount!.accountNumber}`);
  console.log(`  Balance: Rs.${activeAccount!.getBalance().toFixed(2)}  |  Status: ${activeAccount!.status}`);
  printDivider();
  console.log("  1. Deposit");
  console.log("  2. Withdraw");
  console.log("  3. Transaction history");
  console.log("  4. Sort transactions by amount");
  console.log("  9. Logout");
  printDivider();

  const choice = await prompt("  Choose: ");

  const accountMenuActions: Record<string, () => Promise<void>> = {
    "1": async () => {
      const amt  = parseFloat(await prompt("  Amount to deposit: "));
      const desc = await prompt("  Description (optional): ");
      try {
        const txn = activeAccount!.deposit(amt, desc || undefined);
        console.log(`\n  Deposited Rs.${txn.amount}. New balance: Rs.${txn.balanceAfter}\n`);
      } catch (e) {
        console.log(`\n  Error: ${e instanceof Error ? e.message : e}\n`);
      }
    },

    "2": async () => {
      const amt  = parseFloat(await prompt("  Amount to withdraw: "));
      const desc = await prompt("  Description (optional): ");
      try {
        const txn = activeAccount!.withdraw(amt, desc || undefined);
        console.log(`\n  Withdrew Rs.${txn.amount}. New balance: Rs.${txn.balanceAfter}\n`);
      } catch (e) {
        console.log(`\n  Error: ${e instanceof Error ? e.message : e}\n`);
      }
    },

    "3": async () => {
      const history = activeAccount!.getTransactionHistory();
      console.log(`\n  Transaction History (${history.length} total):`);
      if (history.length === 0) {
        console.log("  No transactions yet.");
      } else {
        history.forEach((t, i) => printTransaction(t, i));
      }
      console.log();
    },

    "4": async () => {
      const input = await prompt("  Sort order (asc / desc): ");
      const order: SortOrder = input.trim() === "desc" ? "desc" : "asc";
      const sorted = sortBy(activeAccount!.getTransactionHistory(), "amount", order);
      console.log(`\n  Sorted by amount (${order}):`);
      sorted.forEach((t, i) => printTransaction(t, i));
      console.log();
    },

    "9": async () => {
      console.log(`\n  Goodbye, ${activeAccount!.owner}!\n`);
      activeAccount = null;
    },
  };

  // noUncheckedIndexedAccess: action could be undefined, must check before calling
  const action = accountMenuActions[choice.trim()];
  if (action !== undefined) {
    await action();
  } else {
    console.log("\n  Invalid option.\n");
  }
}