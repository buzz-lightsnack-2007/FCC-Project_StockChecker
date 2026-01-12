const StockFetcher = require(`../net/outgoing/fetch.js`);
const StockQuote = require(`../data/stock.js`).StockQuote

/**
 * Manages a collection of stock quotes, providing load, select and unload operations and optional lifecycle callbacks (fetch, downloaded, deletion).
 *
 * @class
 */
class StockManager {
    /**
     * Internal map of stock symbol -> StockQuote.
     * @type {Object.<string, StockQuote>}
     * @private
     */
    #stocks = {}

    /**
     * Construct a new StockManager.
     * Currently no constructor initialization is required.
     * @constructor
     */
    constructor() {}

    /**
     * Optional callbacks that can be supplied by consumers to override or
     * observe network and lifecycle events.
     *
     * - fetch(symbol): optional async callback to fetch a StockQuote for a symbol.
     * - downloaded(stock): optional callback invoked after a stock is available.
     * - deletion(symbol): optional callback invoked when a stock is unloaded; its return value is used as the result of unload().
     *
     * @type {{
     *   fetch?: function(string): Promise<StockQuote>|undefined,
     *   downloaded?: function(StockQuote): (void|Promise<void>),
     *   deletion?: function(string): boolean
     * }}
     */
    callbacks = {}

    /**
     * Access the internal stocks cache.
     *
     * Note: this returns the internal object reference (not a copy).
     *
     * @returns {Object.<string, StockQuote>} Map of symbol -> StockQuote
     */
    get stocks() {
        return (this.#stocks);
    }

    /**
     * Ensure a stock is loaded for the given symbol.
     * - If already present in cache, returns the cached StockQuote.
     * - If a callbacks.fetch function is provided it will be used to obtain the StockQuote; otherwise a StockFetcher instance is used.
     * - After obtaining a StockQuote, callbacks.downloaded (if present) is awaited/invoked.
     *
     * @async
     * @param {string} symbol - The stock symbol to load.
     * @returns {Promise<StockQuote|undefined>} The loaded StockQuote or undefined if fetching failed.
     */
    async fetch(symbol) {
        if (Object.keys(this.#stocks).includes(symbol)) {
            return this.select(symbol);
        }
        let fetched = ((typeof(this.callbacks?.fetch)).includes(`func`)) ? await this.callbacks.fetch(symbol) : undefined;
        
        if (!(fetched)) {
            let fetcher = new StockFetcher();
            fetcher.symbol = symbol;
            this.#stocks[symbol] = await fetcher.fetch();
        }

        ((typeof(this.callbacks?.downloaded)).includes(`func`)) && await this.callbacks?.downloaded(this.#stocks[symbol]);
        return this.select(symbol)
    }

    /**
     * Return the cached StockQuote for a symbol (if present).
     *
     * @param {string} symbol - The stock symbol to select.
     * @returns {StockQuote|undefined} The StockQuote for the symbol or undefined if not present in the cache.
     */
    select(symbol) {
        return this.#stocks[symbol]
    }

    /**
     * Remove a stock from the cache.
     * - If callbacks.deletion is present it will be invoked and its return value will be returned by this method.
     *
     * @param {string} symbol - The stock symbol to unload.
     * @returns {boolean} The result of the deletion callback if provided or true if successful. 
     */
    unload(symbol) {
        let deletion = ((typeof(this.callbacks?.deletion)).includes(`func`)) ? this.callbacks?.deletion(symbol) : true;
        delete this.#stocks[symbol]
        return deletion
    }
}

module.exports = StockManager