const StockSybmolRegex = require(`../data/stock.js`).StockSybmolRegex
const StockQuote = require(`../data/stock.js`).StockQuote

class StockFetcher {
    #sybmol = '';

    get symbol() {
        return this.#sybmol
    }

    set symbol(symbol) {
        this.#sybmol = (symbol) ? StockSybmolRegex.parse(symbol) : undefined
        return this.#sybmol
    }

    get source() {
        return `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${StockSybmolRegex.parse(this.#sybmol)}/quote`
    }

    async fetch() {
        let fetcher = await fetch(this.source)
        if (!fetcher.ok) {
            throw new ReferenceError(`Received ${fetcher.status}`)
        }
        let response = await fetcher.json()
        if ((typeof(response)).includes(`str`)) {
            throw new SyntaxError(response)
        }

        return new StockQuote(response)
    }
}

module.exports = StockFetcher