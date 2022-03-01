"use strict";

const { default: axios } = require("axios");
const mongoose = require("mongoose");

module.exports = function (app) {
  mongoose.connect(process.env.DB);
  const stockSchema = new mongoose.Schema({
    stock: { type: String, required: true },
    likes: { type: Number, default: 0 },
    ip: { type: [String], default: [] },
  });
  const Stock = mongoose.model("Stock", stockSchema);
  const { promisify } = require("util");
  const { pbkdf2 } = require("crypto");
  const pbkdf2Async = promisify(pbkdf2);
  app.route("/api/stock-prices").get(async (req, res) => {
    let stock = req.query.stock;
    if (!stock) return res.json({ error: "no stock provided" });
    let like = req.query.like || "false";
    if (Array.isArray(stock)) {
      let stocks = stock.slice(0, 2);
      let firstStockResponse = await axios({
        method: "get",
        url: `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stocks[0]}/quote`,
      }).catch((e) => res.json(e));
      let secondStockResponse = await axios({
        method: "get",
        url: `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stocks[1]}/quote`,
      }).catch((e) => res.json(e));
      if (
        !firstStockResponse.data.latestPrice ||
        !secondStockResponse.data.latestPrice
      )
        return res.json({ error: "external source error" });
      let firstStock = await Stock.findOne({ stock: stocks[0] }).catch((e) =>
        res.json(e)
      );
      let secondStock = await Stock.findOne({ stock: stocks[1] }).catch((e) =>
        res.json(e)
      );
      if (!firstStock) {
        firstStock = await Stock.create({ stock: stocks[0] }).catch((e) =>
          res.json(e)
        );
      }
      if (!secondStock) {
        secondStock = await Stock.create({ stock: stocks[1] }).catch((e) =>
          res.json(e)
        );
      }
      let difference = firstStock.likes - secondStock.likes;
      let response = {
        stockData: [
          {
            stock: stocks[0],
            price: firstStockResponse.data.latestPrice,
            rel_likes: difference,
          },
          {
            stock: stocks[1],
            price: secondStockResponse.data.latestPrice,
            rel_likes: -difference,
          },
        ],
      };
      if (like === "true") {
        firstStock.likes++;
        secondStock.likes++;
        let hashedIP = await pbkdf2Async(
          req.ip,
          req.ip.substring(req.ip.length - 2, req.ip.length),
          100000,
          64,
          "sha512"
        ).catch((e) => res.json(e));
        let firstStockWithIP = await Stock.findOne({
          stock: stocks[0],
          ip: hashedIP,
        }).catch((e) => res.json(e));
        if (!firstStockWithIP) {
          firstStock.likes++;
          firstStock.ip.push(hashedIP);
        }
        await firstStock.save().catch((e) => res.json(e));
        let secondStockWithIP = await Stock.findOne({
          stock: stocks[1],
          ip: hashedIP,
        }).catch((e) => res.json(e));
        if (!secondStockWithIP) {
          secondStock.likes++;
          secondStock.ip.push(hashedIP);
        }
        await secondStock.save().catch((e) => res.json(e));
      }
      res.json(response);
    } else {
      let stockResponse = await axios({
        method: "get",
        url: `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`,
      }).catch((e) => res.json(e));
      if (!stockResponse.data.latestPrice)
        return res.json({ error: "external source error" });
      let foundStock = await Stock.findOne({ stock }).catch((e) => res.json(e));
      if (!foundStock) {
        foundStock = await Stock.create({ stock }).catch((e) => res.json(e));
      }
      if (like === "true") {
        let hashedIP = await pbkdf2Async(
          req.ip,
          req.ip.substring(req.ip.length - 2, req.ip.length),
          100000,
          64,
          "sha512"
        ).catch((e) => res.json(e));
        let stockWithIP = await Stock.findOne({ stock, ip: hashedIP }).catch(
          (e) => res.json(e)
        );
        if (!stockWithIP) {
          foundStock.likes++;
          foundStock.ip.push(hashedIP);
        }
        await foundStock.save().catch((e) => res.json(e));
      }
      res.json({
        stockData: {
          stock,
          price: stockResponse.data.latestPrice,
          likes: foundStock.likes,
        },
      });
    }
  });
};
