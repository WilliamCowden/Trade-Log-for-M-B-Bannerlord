import pg from "pg";

async function newQuery(query_string, query_array) {
  try {
    const db = new pg.Client({
      user: "postgres",
      host: "localhost",
      database: "TL",
      password: "1234",
      port: 5432,
    });

    await db.connect();
    console.log("\nDB_QUERY: connection established");

    if (!query_array) {query_array = []};
    console.log("DB_QUERY: trying query: " + query_string + query_array);
    const result = await db.query(query_string, query_array);
    console.log("DB_QUERY: query successful");

    await db.end();
    console.log("DB_QUERY: connection ended");

    return result.rows;

  } catch (err) {
    console.log(err);
    return err;
  }
}


export class TradeLog {
  productInventory; // holds products from DB
  transactionLog;

  // INVENTORY LOGIC
  async buy(product_name, product_quantity, product_price, merchant) {

    if (!product_name || !product_quantity || !product_price) {return false}; // guard clause

    // add purchase to inventory
    await newQuery(
      "UPDATE product_inventory SET stock = stock + $1, total_invested = total_invested + $2 WHERE name = $3",
      [product_quantity, product_price, product_name]
    );

    // create new transaction_log entry
    await this.newTransactionLog(
      product_name, 
      product_quantity, 
      product_price,
      merchant, 
      "buy"
    );
  }

  async sell(product_name, product_quantity, product_price, merchant) {

    if (!product_name) {return false}; // guard clause

    // add sale to inventory
    if (!product_quantity) {product_quantity = product_name};
    await newQuery(
      "UPDATE product_inventory SET stock = 0, total_invested = total_invested - $1 WHERE name = $2",
      [product_price, product_name]
    );

    await newQuery(
      "UPDATE product_inventory SET stock = stock - $1, total_invested = total_invested - $2 WHERE name = $3",
      [product_quantity, product_price, product_name]
    );

    // create new transaction_log entry
    await this.newTransactionLog(
      product_name,
      product_quantity,
      product_price,
      merchant,
      "sell"
    );
  }

  async getInventory() {
      await this.updateInventory();
      return this.productInventory;
    }

  async updateInventory() {
    this.productInventory = await newQuery(
      "SELECT name, stock, total_invested FROM product_inventory"
    );
    await this.errorCheckInventory();
    console.log( // log inventory after error check
      "\nUPDATED_INVENTORY:\n" + JSON.stringify(this.productInventory
      )); 
  }
  
  // zero-out inventory for products with 0 stock but positive total_invested
  async errorCheckInventory() {

    if (!this.productInventory) {return;} // make sure productInventory is truthy

    this.productInventory.forEach(async (i) => {
      if ((i.stock <= 0 && i.total_invested > 0) || i.stock < 0) {
        await this.resetProduct(i.name);
      }
    });
    
  }

  async resetProduct(productName) {
    await newQuery(
      "UPDATE product_inventory SET total_invested = 0 WHERE name = $1",
      [productName]
    );
  }
  

  // LOG LOGIC
  async newTransactionLog(product_name, product_quantity, product_price, merchant, transaction_type) {
    await newQuery(
      "INSERT INTO transaction_log (name, quantity, price, merchant, transaction_type) VALUES ($1,$2,$3,$4,$5)", 
      [product_name, product_quantity, product_price, merchant, transaction_type]
    );
  }

  async getTransactionLog() {
    await this.updateTransactionLog();
    return this.transactionLog;
  }

  async updateTransactionLog() {
    this.transactionLog = await newQuery(
      "SELECT * FROM transaction_log"
    );
    console.log(
      "\nUPDATED_LOG:\n" + JSON.stringify(this.transactionLog)
    );
  }
};
