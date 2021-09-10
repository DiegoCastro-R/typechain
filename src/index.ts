import * as crypto from "crypto";

class Transaction {
  constructor(
    public amount: number,
    public payer: string, // address public key
    public payee: string // address public key
  ) {}

  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  public nonce = Math.round(Math.random() * 99999999999999);

  constructor(
    public previousHash: string, // Link to previous transaction's block
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash("SHA256");
    hash.update(str).end();
    return hash.digest("hex");
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    //@ts-ignore
    this.chain = [new Block(null, new Transaction(100, "genesis", "satoshi"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  mine(nonce: number) {
    let solution = 1;
    console.log("⛏️ mining...");

    while (true) {
      const hash = crypto.createHash("MD5");
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest("hex");

      if (attempt.substr(0, 4) === "0000") {
        console.log(`{Solved: ${solution}}`);
        return solution;
      }

      solution += 1;
    }
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.toString());

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }
}

class Wallet {
  public publicKey: string; // Receive
  public privateKey: string; // Spend

  constructor() {
    const keypair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  sendMoney(amount: number, payyeePublicKey: string) {
    const transaction = new Transaction(
      amount,
      this.publicKey,
      payyeePublicKey
    );

    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

// Example of Usage

const Satoshi = new Wallet();
const Diego = new Wallet();
const Bob = new Wallet();

Satoshi.sendMoney(50, Diego.publicKey);
Diego.sendMoney(15, Bob.publicKey);

console.log(Chain.instance);
