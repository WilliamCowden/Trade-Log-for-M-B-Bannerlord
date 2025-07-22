import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { ProductManager } from "./other_modules/db_logic.js";

// server variables
const app = express();
const port = 80;
const ip = "0.0.0.0";
const __dirname = dirname(fileURLToPath(import.meta.url));
let pm = new ProductManager();
let inventory;

// middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));

// routes
app.get("/", async (req, res) => {
    inventory = await pm.updateInventory();

    res.render(__dirname + "/views/index.ejs", res.locals = { 
        dir: __dirname, inventory:inventory, pm:pm
    });
});

app.post("/update", async (req, res) => {
    console.log({REQUEST:req.body});
    
    if (req.body.transaction_type == "buy") {
        await pm.buy(
            req.body.product_name,
            req.body.product_quantity,
            req.body.product_price
        );
    }
    else if(req.body.transaction_type == "sell") {
        await pm.sell(
            req.body.product_name,
            req.body.product_quantity,
            req.body.product_price
        );
    };
    res.redirect("/");
});

app.listen(port, ip, () => {
    console.log(`app is running on port:${port}`);
});