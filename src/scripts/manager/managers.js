const z = require(`zod`).z
const StockManager = require(`./stockmanager.js`);
const StockWatchers = require(`./stockwatcher.js`);
const StockQuote = require(`../data/stock.js`).StockQuote
const Watcher = require(`../data/watcher.js`);

/**
 * Container for the result of manager operations.
 * Holds either a single StockQuote or a dictionary of StockQuote objects, and an array of Watcher instances.
 * @class ManagersResult
 */
class ManagersResult {
    /**
     * Internal storage for stocks.
     * @private
     * @type {StockQuote|Object.<string, StockQuote>}
     */
    #stocks = {}; 

    /**
     * Get the stored stocks.
     * @returns {StockQuote|Object.<string, StockQuote>}
     */
    get stocks() {return this.#stocks};

    /**
     * Set the stored stocks. Validated via zod to be either a StockQuote instance or a object of StockQuotes. 
     * @param {StockQuote|Object.<string, StockQuote>} stocks
     */
    set stocks(stocks) {this.#stocks = z.union([z.instanceof(StockQuote), z.object({}).loose()]).parse(stocks)};

    /** 
     * Internal storage for watchers.
     * @private
     * @type {Watcher[]}
     */
    #watchers = []; 

    /**
     * Get the array of watchers.
     * @returns {Watcher[]}
     */
    get watchers() {return this.#watchers};

    /**
     * Set the watchers array. Validated via zod to be an array of Watcher instances.
     * @param {Watcher[]} watchers
     */
    set watchers(watchers) {this.#watchers = z.array(z.instanceof(Watcher)).parse(watchers)};

    /**
     * Create a ManagersResult.
     * @param {StockQuote|Object.<string, StockQuote>} [stocks] - Initial stock or stocks map.
     * @param {Watcher[]} [watchers] - Initial array of watchers.
     */
    constructor(stocks = undefined, watchers = undefined) {
        stocks && (this.stocks = stocks);
        watchers && (this.watchers = watchers);
    };
};

/**
 * Represents a comparison result between multiple ManagersResult entries.
 * Contains the raw data map and computed comparison getters.
 * 
 * @class ManagersComparisonResult
 */
class ManagersComparisonResult {
    /**
     * Map of manager name => ManagersResult
     * @type {Object.<string, ManagersResult>}
     */
    data = {};
    
    /**
     * Construct a ManagersComparisonResult.
     * Accepts a loose object validated by zod before assignment.
     * @param {Object.<string, ManagersResult>} [data]
     */
    constructor(data = undefined) {
        z.object({}).loose().safeParse(data).success && (this.data = data);
    };

    /**
     * Compute comparison metrics between the stored ManagersResult entries.
     * - watchers: difference in watcher counts between adjacent entries
     * - stocks: numeric differences in stock values between adjacent entries (only numeric fields)
     * @type {{watchers: Object.<string, number>, stocks: Object.<string, Object.<string, number>>}}
     */
    get comparison() {
        const popular = () => {
            let difference = {};
            for (let index = 0; index < Object.entries(this.data).length; index++) {
                difference[Object.keys(this.data)[index]] = Object.values(this.data).slice(-(1 - index), index ? -index : undefined)[0].watchers.length - Object.values(this.data)[index].watchers.length;
            };
            return (difference);
        };

        const differences = () => {
            let difference = {};
            for (let index = 0; index < Object.entries(this.data).length; index++) {
                difference[Object.keys(this.data)[index]] = Object.fromEntries(
                    (() => {
                        let comparisons = []
                        Object.keys(this.names).forEach((name) => {
                            [Object.values(this.data)[index].stocks[name], Object.values(this.data).slice(-(1 - index), index ? -index : undefined)[0].stocks[name]].every((value) => ((typeof(value)).includes(`num`) || value instanceof Date))
                                ? comparisons.push([name, 
                                    Object.values(this.data).slice(-(1 - index), index ? -index : undefined)[0].stocks[name] - Object.values(this.data)[index].stocks[name]
                                ])
                                : false;
                        });

                        return comparisons;
                    })()
                );
            };
            return difference;
        };

        return {
            "watchers": popular(),
            "stocks": differences()
        };
    };

    /**
     * Return the names (keys) of the stored data entries.
     * @returns {string[]}
     */
    get names() {
        return Object.keys(this.data);
    };
}

/**
 * High-level manager aggregating stock fetching and watcher management.
 * Provides convenience methods to read stock data, add watchers, and compare results.
 */
class Managers {
    /**
     * Stock manager instance used to fetch quotes.
     * @type {StockManager}
     */
    stocks; 

    /**
     * Stock watcher manager instance used to manage watchers.
     * @type {StockWatchers}
     */
    watchers; 

    /**
     * Initialize Managers with concrete StockManager and StockWatchers instances.
     */
    constructor() {
        this.stocks = new StockManager();
        this.watchers = new StockWatchers();
    }

    /**
     * Get the currently loaded stocks and watchers as a ManagersResult.
     * @returns {ManagersResult}
     */
    get loaded() {
        return new ManagersResult(this.stocks?.stocks, this.watchers.items)
    }

    /**
     * Read the stock information for a symbol and include any watchers for the quote.
     * @param {string} symbol - The stock symbol to read.
     * @async
     * @function read
     * @returns {Promise<ManagersResult>} Resolves to a ManagersResult containing the quote and watchers.
     */
    async read(symbol) {
        let quote = await this.stocks.fetch(symbol)
        let result = new ManagersResult(quote, this.watchers.search(quote));
        return result
    }

    /**
     * Add a watcher address for the given stock symbol.
     * Reads the current stock to validate and then registers the watcher.
     * @async
     * @function watch
     * @param {string|string[]} symbol - Stock symbol to watch.
     * @param {string} address - Watcher address to add.
     * @returns {Promise<ManagersResult>} The updated ManagersResult after adding the watcher.
     */
    async watch(symbol, address) {
        let names = (Array.isArray(symbol)) ? symbol : [symbol];

        for (let index = 0; index < names.length; index++) {
            let initial = await this.read(names[index]); // will throw an error here if invalid
            this.watchers.add(initial.stocks, address);
        };

        return await this[(Array.isArray(symbol)) ? `compare` : `read`](symbol);
    }

    /**
     * Compare up to two symbols by reading their ManagersResult and returning a comparison.
     * @param {string[]} symbols - Array of symbols to compare (only first two are used).
     * @returns {Promise<ManagersComparisonResult>}
     */
    async compare(symbols) {
        let names = symbols.slice(0, 2);
        let data = await Promise.all(names.map(async (symbol) => {
            return [symbol, await this.read(symbol)]
        }))

        return new ManagersComparisonResult(Object.fromEntries(data));
    }
}

module.exports = {
    ManagersResult, ManagersComparisonResult, Managers
}