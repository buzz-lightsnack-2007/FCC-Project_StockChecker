const z = require(`zod`).z
const Watcher = require(`../data/watcher.js`)
const StockQuote = require(`../data/stock.js`).StockQuote

/**
 * A class to manage stock watchers, allowing for adding, searching, and retrieving stocks and addresses.
 */
class StockWatchers {
    /**
     * The list of stock watchers.
     * Each watcher contains information about a stock and its associated address.
     * @private
     * @type {Watcher[]}
     */
    #watchers = []

    /**
     * Creates an instance of StockWatchers.
     */
    constructor() {}

    /**
     * Callbacks
     */
    callbacks = {}

    /**
     * Searches for watchers based on the provided stock and/or address.
     * If no parameters are provided, returns all watchers.
     * 
     * @param {string|StockQuote} [stock=''] - The stock symbol to search for
     * @param {string} [address=''] - The address associated with the stock to search for (optional).
     * @returns {Watcher[]} An array of watchers matching the search criteria.
     */
    search(stock = '', address = '') {
        z.union(z.instanceof(StockQuote), require(`../data/stock.js`).StockSybmolRegex).nullable().optional().parse(stock) && z.hostname().nullable().optional().parse(address)

        /**
         * @function validate
         * @param {Watcher} watcher - the watcher to validate
         * @returns 
         */
        let validate = (watcher) => {
            if (!stock) {return true}
            return (watcher.stock.filter(((typeof(stock)).includes(`obj`)) 
                ? ((added_stock) => (added_stock == stock)) 
                : ((added_stock) => (added_stock.symbol == stock))).length)
        }
        
        // Callback
        (typeof(this.callbacks?.search)).includes(`func`) && this.callbacks?.search(stock, address);

        return this.#watchers.filter((value) => (
            (!(address) || (address == value.address)) && validate(value)
        ));
    }

    /**
     * Retrieves all watchers.
     * 
     * @readonly
     * @type {Watcher[]}
     */
    get items() {
        return this.search()
    };

    /**
     * Retrieves a unique set of all stock symbols being watched.
     * 
     * @readonly
     * @type {Set<string>}
     */
    get stocks() {
        let stocks = new Set();
        this.search.forEach(
            /**
             * 
             * @param {Watcher} watcher - the watcher
             */
            (watcher) => {
                stocks.union(new Set(watcher.stock))
            });
        
        return (stocks);
    };

    /**
     * Retrieves a unique set of all addresses associated with the watched stocks.
     * 
     * @readonly
     * @type {Set<string>}
     */
    get addresses() {
        return new Set(this.search.map((value) => value.address));
    }

    /**
     * Adds a new stock watcher with the specified stock and address.
     * Validates the stock and address before adding.
     * 
     * @param {StockQuote|string} stock - The stock to be added.
     * @param {string} address - The address associated with the stock. 
     */
    add(stock, address, callback = null) {
        z.instanceof(StockQuote).parse(stock) && z.hostname().parse(address);

        const find = () => {
            let matching = this.search(stock, address);
            return matching.length;
        }
        
        const append = () => {
            const create = () => {
                /**
                 * @type {Watcher}
                 */
                let watcher = new Watcher({"stock": [StockQuote], "address": address});
                this.#watchers.push(watcher)
                return true
            }

            const update = () => {
                for (let index = 0; index < this.#watchers.length; index++) {
                    if (this.#watchers[index].address == address) {
                        this.#watchers[index].stock.push(stock)
                        return true;
                    };
                };

                return false;
            };
            
            return (this.search(undefined, address).length ? update : create)()
        }

        !find() && append()
    }
}

module.exports = StockWatchers