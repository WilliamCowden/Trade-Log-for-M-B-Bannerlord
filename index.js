import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { TradeLog } from "./other_modules/db_logic.js";

// server variables
const app = express();
const port = 80;
const ip = "0.0.0.0";
const __dirname = dirname(fileURLToPath(import.meta.url));
let tl = new TradeLog();
let inventory;
let log;

// middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));

// routes
app.get("/", async (req, res) => {
    inventory = await tl.getInventory();
    log = await tl.getTransactionLog();

    res.render(__dirname + "/views/index.ejs", res.locals = { 
        dir:__dirname, inventory:inventory, log:log
    });
});

app.post("/update", async (req, res) => {
    console.log("\nREQUEST:\n" + JSON.stringify(req.body));
    if (req.body.transaction_type == "buy") {
        await tl.buy(
            req.body.product_name,
            req.body.product_quantity,
            req.body.product_price,
            req.body.merchant
        );
    }
    else if(req.body.transaction_type == "sell") {
        await tl.sell(
            req.body.product_name,
            req.body.product_quantity,
            req.body.product_price,
            req.body.merchant
        );
    };
    res.redirect("/");
});

app.listen(port, ip, () => {
    console.log(`app is running on port:${port}`);
});