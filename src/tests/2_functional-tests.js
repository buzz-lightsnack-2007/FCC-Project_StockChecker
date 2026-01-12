const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const z = require(`zod`).z;

const StockSybmolRegex = require(`../scripts/data/stock.js`).StockSybmolRegex;

chai.use(chaiHttp);

suite('Functional Tests', function() {
    test(`Viewing one stock: GET request to /api/stock-prices/`, (done) => {
        let symbol = "DIS";
        chai.request(server).keepOpen()
            .get(`/api/stock-prices`)
            .query({"stock": symbol})
            .end(
                /**
                 * Handles the response from the GET request to `/api/stock-prices`.
                 *
                 * @param {*} err - The error object, if any occurred during the request.
                 * @param {*} res - The response object returned by the server.
                 * @throws {AssertionError} If any of the assertions fail.
                 */
                (err, res) => {
                    assert.equal(res.status, 200, `Expected status code 200 but received ${res.status}`);
                    assert.isObject(res.body, `The response should be an object; received ${typeof(res.body)}`);
                    assert.isObject(res.body?.stockData, `The response object must be contained within a stockData key; it’s currently a ${typeof(res.body?.stockData)}.`);
                    assert.include(res.body?.stockData?.stock, symbol, `The response involved a different symbol (${res.body?.stockData?.stock}) than configured (${symbol}).`);
                    assert.isNumber(res.body?.stockData?.likes, `The likes count doesn’t appear to be a number; it’s currently a ${typeof(res.body?.stockData?.likes)}.`);
                }
            );
        return done();
    });
    test(`Viewing one stock and liking it: GET request to /api/stock-prices/`, (done) => {
        let symbol = "DIS";
        chai.request(server).keepOpen()
            .get(`/api/stock-prices`)
            .query({"stock": symbol, "watch": true})
            .end(
                /**
                 * Handles the response from the GET request to `/api/stock-prices`.
                 *
                 * @param {*} err - The error object, if any occurred during the request.
                 * @param {*} res - The response object returned by the server.
                 * @throws {AssertionError} If any of the assertions fail.
                 */
                (err, res) => {
                    assert.equal(res.status, 200, `Expected status code 200 but received ${res.status}`);
                    assert.isObject(res.body, `The response should be an object; received ${typeof(res.body)}`);
                    assert.isObject(res.body?.stockData, `The response object must be contained within a stockData key; it’s currently a ${typeof(res.body?.stockData)}.`);
                    assert.include(res.body?.stockData?.stock, symbol, `The response involved a different symbol (${res.body?.stockData?.stock}) than configured (${symbol}).`);
                    assert.isNumber(res.body?.stockData?.likes, `The likes count doesn’t appear to be a number; it’s currently a ${typeof(res.body?.stockData?.likes)}.`);
                }
            );
        return done();
    });
    test(`Viewing the same stock and liking it again: GET request to /api/stock-prices/`, (done) => {
        let symbol = "DIS";
        chai.request(server).keepOpen()
            .get(`/api/stock-prices`)
            .query({"stock": symbol, "watch": true})
            .end(
                /**
                 * Handles the response from the GET request to `/api/stock-prices`.
                 *
                 * @param {*} err - The error object, if any occurred during the request.
                 * @param {*} res - The response object returned by the server.
                 * @throws {AssertionError} If any of the assertions fail.
                 */
                (err, res) => {
                    assert.equal(res.status, 200, `Expected status code 200 but received ${res.status}`);
                    assert.isObject(res.body, `The response should be an object; received ${typeof(res.body)}`);
                    assert.isObject(res.body?.stockData, `The response object must be contained within a stockData key; it’s currently a ${typeof(res.body?.stockData)}.`);
                    assert.include(res.body?.stockData?.stock, symbol, `The response involved a different symbol (${res.body?.stockData?.stock}) than configured (${symbol}).`);
                    assert.isNumber(res.body?.stockData?.likes, `The likes count doesn’t appear to be a number; it’s currently a ${typeof(res.body?.stockData?.likes)}.`);
                }
            );
        return done();
    });
    test(`Viewing two stocks: GET request to /api/stock-prices/`, (done) => {
        let symbol = [`DIS`, `NKE`];
        chai.request(server).keepOpen()
            .get(`/api/stock-prices`)
            .query({"stock": symbol})
            .end(
                /**
                 * Handles the response from the GET request to `/api/stock-prices`.
                 *
                 * @param {*} err - The error object, if any occurred during the request.
                 * @param {*} res - The response object returned by the server.
                 * @throws {AssertionError} If any of the assertions fail.
                 */
                (err, res) => {
                    assert.equal(res.status, 200, `Expected status code 200 but received ${res.status}`);
                    assert.isObject(res.body, `The response should be an object; received ${typeof(res.body)}`);
                    assert.isArray(res.body?.stockData, `The response array must be contained within a stockData key; it’s currently a ${typeof(res.body?.stockData)}.`);
                    res.body.stockData.forEach((stock) => {
                        assert.isString(stock?.stock);
                        assert.isNumber(stock?.price);
                        assert.isNumber(stock?.rel_likes);
                    });
                }
            );
        return done();
    });
    test(`Viewing two stocks and liking them: GET request to /api/stock-prices/`, (done) => {
let symbol = [`DIS`, `NKE`];
        chai.request(server).keepOpen()
            .get(`/api/stock-prices`)
            .query({"stock": symbol, "watch": true})
            .end(
                /**
                 * Handles the response from the GET request to `/api/stock-prices`.
                 *
                 * @param {*} err - The error object, if any occurred during the request.
                 * @param {*} res - The response object returned by the server.
                 * @throws {AssertionError} If any of the assertions fail.
                 */
                (err, res) => {
                    assert.equal(res.status, 200, `Expected status code 200 but received ${res.status}`);
                    assert.isObject(res.body, `The response should be an object; received ${typeof(res.body)}`);
                    assert.isArray(res.body?.stockData, `The response array must be contained within a stockData key; it’s currently a ${typeof(res.body?.stockData)}.`);
                    res.body.stockData.forEach((stock) => {
                        assert.isString(stock?.stock);
                        assert.isNumber(stock?.price);
                        assert.isNumber(stock?.rel_likes);
                    });
                }
            );
        return done();
    })
});