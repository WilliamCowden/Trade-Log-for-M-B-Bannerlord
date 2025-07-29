import pg from "pg";

async function newQuery(query_string, query_data) {
  try {
    const db = new pg.Client({
      user: "postgres",
      host: "localhost",
      database: "TL",
      password: "1234",
      port: 5432,
    });
    await db.connect();
    console.log("DB_QUERY: connection established");
    console.log("DB_QUERY: trying query: " + query_string);
    const result = await db.query(query_string, query_data);
    console.log("DB_QUERY: query successful");
    await db.end();
    console.log("DB_QUERY: connection ended");
    return result.rows;
  } catch (err) {
    console.log(err);
    return err;
  }
}


export class ProductManager {
  inventory; // holds products from DB

  async buy(product_name, product_quantity, product_price = 0) {
    if (product_quantity <= 0) {
      console.log("DB_QUERY: error at function 'buy', product_quantity is invalid"); 
      return; 
    };
    if (!product_price) {product_price = 0;};
    await newQuery(
      `UPDATE inventory SET stock = stock + ${product_quantity}, totalinvested = totalinvested + ${product_price} WHERE name = '${product_name}';`
    );
    
  }

  async sell(product_name, product_quantity, product_price) {
    if (!product_price) {product_price = 0;};
    if (!product_quantity) {
      await newQuery(
        `UPDATE inventory SET stock = 0, totalinvested = totalinvested - ${product_price} WHERE name = '${product_name}';`
      );
    } else {
      await newQuery(
        `UPDATE inventory SET stock = stock - ${product_quantity}, totalinvested = totalinvested - ${product_price} WHERE name = '${product_name}';`
      );
    }
  }

  async checkInventory() {
    if (!this.inventory) {return;} // guard clause to make sure inventory is truthy before validating
    this.inventory.forEach(async (i) => {
      if ((i.stock <= 0 && i.totalinvested > 0) || i.stock < 0) {
        await this.resetProduct(i.name);
      }
    });
    console.log({ UPDATED_INVENTORY: this.inventory }); // log updated inventory
  }

  async resetProduct(productName) {
    await newQuery(
      `UPDATE inventory SET totalinvested = 0 WHERE name = '${productName}';`
    );
  }

  async updateInventory() {
    this.inventory = await newQuery(
      "SELECT name, stock, totalinvested FROM inventory"
    );
    this.checkInventory();
    return this.inventory;
  }

  async getLog() {
    return await newQuery();
  }
};


