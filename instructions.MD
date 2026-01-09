# Stock Price Checker
Build a full stack JavaScript app that is functionally similar to [this: https://stock-price-checker.freecodecamp.rocks/](https://stock-price-checker.freecodecamp.rocks/).

Since all reliable stock price APIs require an API key, we've built a workaround. [Use https://stock-price-checker-proxy.freecodecamp.rocks/](https://stock-price-checker-proxy.freecodecamp.rocks/) to get up-to-date stock price information without needing to sign up for your own key.

Working on this project will involve you writing your code using one of the following methods:

- Clone this GitHub repo and complete your project locally.

- Use a site builder of your choice to complete the project. Be sure to incorporate all the files from our GitHub repo.

---

1. Set the `NODE_ENV` environment variable to `test`, without quotes
2. Complete the project in `routes/api.js` or by creating a handler/controller
3. You will add any security features to `server.js`
4. You will create all of the functional tests in `tests/2_functional-tests.js`

Note Privacy Considerations: Due to the requirement that only 1 like per IP should be accepted, you will have to save IP addresses. It is important to remain compliant with data privacy laws such as the General Data Protection Regulation. One option is to get permission to save the user's data, but it is much simpler to anonymize it. For this challenge, remember to anonymize IP addresses before saving them to the database. If you need ideas on how to do this, you may choose to hash the data, truncate it, or set part of the IP address to 0.

Write the following tests in `tests/2_functional-tests.js`:

- Viewing one stock: GET request to `/api/stock-prices/`
- Viewing one stock and liking it: GET request to `/api/stock-prices/`
- Viewing the same stock and liking it again: GET request to `/api/stock-prices/`
- Viewing two stocks: GET request to `/api/stock-prices/`
- Viewing two stocks and liking them: GET request to `/api/stock-prices/`


## Tests
1. You can provide your own project, not the example URL.
2. You should set the content security policies to only allow loading of scripts and CSS from your server.
3. You can send a GET request to /api/stock-prices, passing a NASDAQ stock symbol to a stock query parameter. The returned object will contain a property named stockData.
4. The stockData property includes the stock symbol as a string, the price as a number, and likes as a number.
5. You can also pass along a like field as true (boolean) to have your like added to the stock(s). Only 1 like per IP should be accepted.
6. If you pass along 2 stocks, the returned value will be an array with information about both stocks. Instead of likes, it will display rel_likes (the difference between the likes on both stocks) for both stockData objects.
7. All 5 functional tests are complete and passing.