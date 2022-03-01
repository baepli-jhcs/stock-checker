const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("GET /api/stock-prices => object", () => {
    let likes = 0;
    test("View One Stock", async () => {
      let res = await chai
        .request(server)
        .get("/api/stock-prices?stock=GOOG")
        .catch((e) => console.log(e));
      assert.isObject(res.body.stockData);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.isNumber(res.body.stockData.price);
      likes = res.body.stockData.likes;
      assert.isNumber(res.body.stockData.likes);
    });
    test("View One Stock and Like", async () => {
      let res = await chai
        .request(server)
        .get("/api/stock-prices?stock=GOOG&like=true")
        .catch((e) => console.log(e));
      assert.isObject(res.body.stockData);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.isNumber(res.body.stockData.price);
      assert.equal(res.body.stockData.likes, likes + 1);
    });
    test("View Same Stock and Like", async () => {
      let res = await chai
        .request(server)
        .get("/api/stock-prices?stock=GOOG&like=true")
        .catch((e) => console.log(e));
      assert.isObject(res.body.stockData);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.isNumber(res.body.stockData.price);
      assert.equal(res.body.stockData.likes, likes + 1);
    });
    test("View Two Stocks", async () => {
      let res = await chai
        .request(server)
        .get("/api/stock-prices?stock=GOOG&stock=MSFT")
        .catch((e) => console.log(e));
      assert.isArray(res.body.stockData);
      assert.equal(res.body.stockData.length, 2);
      assert.isObject(res.body.stockData[0]);
      assert.equal(res.body.stockData[0].stock, "GOOG");
      assert.isNumber(res.body.stockData[0].price);
      assert.isObject(res.body.stockData[1]);
      assert.equal(res.body.stockData[1].stock, "MSFT");
      assert.isNumber(res.body.stockData[1].price);
    });
    test("View Two Stocks with Like Parameter", async () => {
      let res = await chai
        .request(server)
        .get("/api/stock-prices?stock=GOOG&stock=MSFT&like=true")
        .catch((e) => console.log(e));
      assert.isArray(res.body.stockData);
      assert.equal(res.body.stockData.length, 2);
      assert.isObject(res.body.stockData[0]);
      assert.equal(res.body.stockData[0].stock, "GOOG");
      assert.isNumber(res.body.stockData[0].price);
      assert.isNumber(res.body.stockData[0]["rel_likes"]);
      assert.isObject(res.body.stockData[1]);
      assert.equal(res.body.stockData[1].stock, "MSFT");
      assert.isNumber(res.body.stockData[1].price);
      assert.isNumber(res.body.stockData[1]["rel_likes"]);
    });
  });
});
