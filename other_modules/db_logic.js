import pg from "pg";

async function newQuery(query_string) {
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
    const result = await db.query(query_string);
    console.log("DB_QUERY: query successful: " + query_string);
    await db.end();
    console.log("DB_QUERY: connection ended");
    return result.rows;
  } catch (err) {
    console.log(err);
    return err;
  }
}

export class ProductManager {
  inventory;

  async buy(productName, productQuantity, price) {
    await newQuery(
      `UPDATE inventory SET stock = stock + ${Number(productQuantity)}, totalinvested = totalinvested + ${Number(price)} WHERE name = '${productName}';`
    );
  };

  async sell(productName, productQuantity, price = 0) {
    if (productQuantity == false) {
      await newQuery(
        `UPDATE inventory SET stock = 0, totalinvested = totalinvested - ${Number(price)} WHERE name = '${productName}';`
      );
    } else {
      await newQuery(
        `UPDATE inventory SET stock = stock - ${Number(productQuantity)}, totalinvested = totalinvested - ${Number(price)} WHERE name = '${productName}';`
      );
    }
  };

  async updateInventory() {
    this.inventory = await newQuery("SELECT name, stock, totalinvested FROM inventory");
    this.checkInventory();
    return this.inventory;
  };

  async checkInventory() {
    if (!this.inventory) {return;} // guard clause to make sure inventory is truthy before validating
    this.inventory.forEach(async (i) => {
      if ((i.stock <= 0 && i.totalinvested > 0) || i.stock < 0) {
        await this.resetProduct(i.name);
      };
    });
    console.log({UPDATED_INVENTORY:this.inventory});
  }

  async resetProduct(productName) {
    await newQuery(`UPDATE inventory SET totalinvested = 0 WHERE name = '${productName}';`);
  };

 async getLog() {
  return await newQuery();
};

};


