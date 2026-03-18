// - TypeScript Practice: Bank Account CLI
// - Build a command-line bank account management system in TypeScript that supports the following:
// - Core Features
//
// - Create a bank account with an owner name and optional initial deposit
// - Deposit money into an account
// - Withdraw money (with insufficient funds handling)
// - Check current balance
// - View full transaction history (each entry should record the transaction type, amount, and balance after the transaction)
// - View a mini statement (last N transactions)
// - Transfer money between two accounts

import * as readline from "readline";

//types of accounts active freeze and closed 
enum AccountStatus {
  "ACTIVE" = "ACTIVE",
  "FROZEN" = "FROZEN",
  "CLOSED" = "CLOSED",
}

//types of transactions
enum TransactionType {
  "DEPOSIT" = "DEPOSIT",
  "WITHDRAWAL" = "WITHDRAWAL",
  "TRANSFER" = "TRANSFER",
}

interface ITransaction {
  id: string,
  type: TransactionType,
  amount: Currency,
  balanceAfter: Currency,
  timestamp: Date,
  description?: string
}

interface IAccount {
  accountNumber: string,
  owner: string,
  status: AccountStatus,
  getBalance(): Currency
  deposit(amount: Currency, description?: string): ITransaction,
  withdraw(amount: Currency, description?: string): ITransaction,
  getTransactionHistory(): ITransaction[]
}

type Currency = number;
type SortOrder = "asc" | "desc";
type index = number;
type TransactionWithIndex = ITransaction & index;

class BankAccount implements IAccount {
  readonly accountNumber: string;
  readonly owner: string;
  status: AccountStatus;
  private _balance = 0;
  private _transactions: ITransaction[] = [];

  constructor(owner: string, initialDeposit?: number) {
    this.owner = owner;
    this.accountNumber = BankAccount.generateAccountNumber();
    this.status = AccountStatus.ACTIVE;
    if (initialDeposit) {
      this.deposit(initialDeposit);
    }
  }

  private static generateAccountNumber(): string {
    return "ACC" + Math.floor(100000 + Math.random() * 900000);
  }

  getBalance(): number {
    return this._balance;
  }

  deposit(amount: Currency, description?: string): ITransaction {
    const validations: [boolean, string][] = [
      [amount <= 0, "Amount must be positive"],
      [this.status === AccountStatus.FROZEN, "Account is frozen"],
      [this.status === AccountStatus.CLOSED, "Account is closed"],
    ];
    for (const [condition, message] of validations) {
      if (condition) throw new Error(message);
    }

    this._balance += amount;
    const transaction: ITransaction = {
      id: "TXN" + Date.now(),
      type: TransactionType.DEPOSIT,
      amount,
      timestamp: new Date(),
      balanceAfter: this._balance,
      description: description ?? "",
    };
    this._transactions.push(transaction);
    return transaction;
  }

  withdraw(amount: Currency, description?: string): ITransaction {
    const validations: [boolean, string][] = [
      [amount <= 0, "Amount must be positive"],
      [this.status === AccountStatus.FROZEN, "Account is frozen"],
      [this.status === AccountStatus.CLOSED, "Account is closed"],
      [amount > this._balance, "Insufficient balance"],
    ];
    for (const [condition, message] of validations) {
      if (condition) throw new Error(message);
    }

    this._balance -= amount;
    const transaction: ITransaction = {
      id: "TXN" + Date.now(),
      type: TransactionType.WITHDRAWAL,
      amount,
      timestamp: new Date(),
      balanceAfter: this._balance,
      description: description ?? "",
    };
    this._transactions.push(transaction);
    return transaction;
  }

  getTransactionHistory(): ITransaction[] {
    return structuredClone(this._transactions);
  }

}

function sortBy<T, K extends keyof T>(arr: T[], key: K, order: SortOrder = "asc"): T[] {

  return arr.slice().sort((a: T, b: T) => {

    const valA = a[key];
    const valB = b[key];

    if (valA < valB) {
      return order === "asc" ? -1 : 1;
    }
    if (valA > valB) {
      return order === "asc" ? 1 : -1;
    }
    return 0;

  });
}

class Bank<T extends IAccount> {
  readonly name: string;
  private _accounts: Map<string, T> = new Map();
  constructor(name: string) {
    this.name = name;
  }
  addAccount(account: T): void {
    this._accounts.set(account.accountNumber, account);
  }

  findAccount(accountNumber: string): T | undefined {

    return this._accounts.get(accountNumber);
  }

  transfer(fromId: string, toId: string, amount: Currency): void {

    const source = this.findAccount(fromId);
    const destination = this.findAccount(toId);

    if (!source)
      throw new Error(`Account ${fromId} not found`);
    if (!destination)
      throw new Error(`Account ${toId} not found`);

    const description = `Transfer of ${amount} from ${source.accountNumber} to ${destination.accountNumber}`;
    source.withdraw(amount, description);
    destination.deposit(amount, description);
  }
  getAllAccounts(): T[] {
    return Array.from(this._accounts.values());
  }
  getTotalDeposits(): Currency {
    return Array.from(this._accounts.values()).reduce((sum, account) => sum + account.getBalance(), 0);
  }
}

// ─── CLI Setup ────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function printDivider() {
  console.log("─".repeat(52));
}

function printTransaction(txn: ITransaction, index: number) {
  const sign = txn.type === TransactionType.DEPOSIT ? "+" : "-";
  console.log(
    `  [${index + 1}] ${txn.type.padEnd(12)} ${sign}Rs.${txn.amount.toFixed(2).padStart(10)}  Balance: Rs.${txn.balanceAfter.toFixed(2)}`
  );
  if (txn.description) console.log(`       ${txn.description}`);
  console.log(`       ${txn.timestamp.toLocaleString()}  |  ${txn.id}`);
}

// ─── App State ────────────────────────────────────────────────────────────────

const bank = new Bank<BankAccount>("Bank");
let activeAccount: BankAccount | null = null;

// ─── Menu Handlers ────────────────────────────────────────────────────────────

async function handleMainMenu(): Promise<boolean> {
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

  // "0" is handled separately since it needs to return false to stop the loop
  if (choice.trim() === "0") return false;

  const mainMenuActions: Record<string, () => Promise<void>> = {
    "1": async () => {
      const name = await prompt("  Owner name: ");
      const depositStr = await prompt("  Initial deposit (press Enter to skip): ");
      const initial = parseFloat(depositStr);
      const acc = new BankAccount(name.trim(), isNaN(initial) ? undefined : initial);
      bank.addAccount(acc);
      console.log(`\n  Account created: ${acc.accountNumber}\n`);
    },

    "2": async () => {
      const id = await prompt("  Account number: ");
      const acc = bank.findAccount(id.trim());
      if (acc) {
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
      const to = await prompt("  To account number: ");
      const amt = parseFloat(await prompt("  Amount: "));
      try {
        bank.transfer(from.trim(), to.trim(), amt);
        console.log(`\n  Transferred Rs.${amt} from ${from.trim()} to ${to.trim()}\n`);
      } catch (e) {
        console.log(`\n  Error: ${e instanceof Error ? e.message : e}\n`);
      }
    },
  };

  const action = mainMenuActions[choice.trim()];
  if (action) {
    await action();
  } else {
    console.log("\n  Invalid option.\n");
  }

  return true;
}

async function handleAccountMenu(): Promise<void> {
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
      const amt = parseFloat(await prompt("  Amount to deposit: "));
      const desc = await prompt("  Description (optional): ");
      try {
        const txn = activeAccount!.deposit(amt, desc || undefined);
        console.log(`\n  Deposited Rs.${txn.amount}. New balance: Rs.${txn.balanceAfter}\n`);
      } catch (e) {
        console.log(`\n  Error: ${e instanceof Error ? e.message : e}\n`);
      }
    },

    "2": async () => {
      const amt = parseFloat(await prompt("  Amount to withdraw: "));
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

  const action = accountMenuActions[choice.trim()];
  if (action) {
    await action();
  } else {
    console.log("\n  Invalid option.\n");
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n  Welcome to Simform Bank\n`);
  let running = true;

  while (running) {
    if (!activeAccount) {
      running = await handleMainMenu();
    } else {
      await handleAccountMenu();
    }
  }

  console.log("\n  Thank you for banking with Simform Bank. Goodbye!\n");
  rl.close();
}

run().catch(console.error);

