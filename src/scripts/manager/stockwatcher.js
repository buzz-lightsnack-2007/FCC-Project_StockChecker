const z = require(`zod`)
const Watcher = require(`../data/watcher.js`)
const StockQuote = require(`../data/stock.js`).StockQuote

/**
 * A manager for stock watchers that supports adding, searching, and retrieving watched stocks and addresses.
 * @class
 */
class StockWatchers {
    /**
     * Internal list of watcher objects managed by this instance.
     * Each entry is expected to be a Watcher with properties like `stock` and `address`.
     * @private
     * @type {Watcher[]}
     */
    #watchers = []

    /**
     * Creates a new StockWatchers manager.
     */
    constructor() {}

    /**
     * Callback hooks that can be provided by callers to react to operations.
     * Example: { search: (stock, address) => { ... } }
     * @type {Object.<string, Function>}
     */
    callbacks = {}

    /**
     * Search for watchers by stock and/or address.
     *
     * If both parameters are omitted, this returns all watchers.
     *
     * @param {string|StockQuote} [stock=''] - Stock symbol string or a StockQuote instance to filter by.
     * @param {string} [address=''] - Address string to filter by.
     * @returns {Watcher[]} Array of Watcher objects matching the criteria.
     */
    search(stock = undefined, address = undefined) {
        z.coerce.string().nullable().optional().parse(address);

        /**
         * Validate whether a watcher matches the provided stock filter.
         * If no stock [symbol] filter is provided, every watcher is considered valid.
         *
         * @param {Watcher} watcher - The watcher to test.
         * @returns {boolean} True if the watcher matches the stock filter.
         */
        let validate = (watcher) => {
            if (!stock) {return true}
            return (watcher.stock.filter(((typeof(stock)).includes(`obj`)) 
                ? ((added_stock) => (added_stock == stock)) 
                : ((added_stock) => (added_stock.symbol == stock))).length)
        }
        
        // Invoke optional search callback hook if provided.
        (typeof(this.callbacks?.search)).includes(`func`) && this.callbacks?.search(stock, address);

        return this.#watchers.filter((value) => (
            (!(address) || (address == value.address)) && validate(value)
        ));
    }

    /**
     * All watcher items currently managed.
     * @type {Watcher[]}
     * @readonly
     */
    get items() {
        return this.search()
    };

    /**
     * Unique set of all stocks observed across watchers.
     * Depending on how stocks are stored, entries may be StockQuote instances or strings.
     *
     * @type {Set<any>}
     * @readonly
     */
    get stocks() {
        let stocks = new Set();
        this.search.forEach(
            /**
             * Add the stock entries from a watcher into the result set.
             * @param {Watcher} watcher - The watcher whose stocks will be merged.
             */
            (watcher) => {
                stocks.union(new Set(watcher.stock))
            });
        
        return (stocks);
    };

    /**
     * Unique set of all addresses associated with watchers.
     * @type {Set<string>}
     * @readonly
     */
    get addresses() {
        return new Set(this.search.map((value) => value.address));
    }

    /**
     * Add a stock to be watched for a given address. If the address already exists, the stock
     * will be appended to that watcher's stock list; otherwise a new watcher will be created.
     *
     * Validation is performed using zod and may throw on invalid input.
     *
     * @param {StockQuote} stock - Stock to add (StockQuote instance expected by validation).
     * @param {string} address - Address associated with the stock.
     * @returns {boolean}
     */
    add(stock, address) {
        z.instanceof(StockQuote).parse(stock);

        /**
         * Determine whether a matching watcher already exists for the stock/address pair.
         * @private
         * @returns {number} Number of matching watchers found.
         */
        const find = () => {
            let matching = this.search(stock, address);
            return matching.length;
        }
        
        /**
         * Append the stock to an existing watcher for the address or create a new watcher.
         * @private
         * @returns {boolean} True if the operation succeeded.
         */
        const append = () => {
            /**
             * Create a new Watcher for the address with the provided stock.
             * @private
             * @returns {boolean} True when creation is complete.
             */
            const create = () => {
                /**
                 * @type {Watcher}
                 */
                let watcher = new Watcher({"stock": [stock], "address": address});
                this.#watchers.push(watcher)
                return true
            }

            /**
             * Update an existing watcher by pushing the new stock onto its stock list.
             * @private
             * @returns {boolean} True if an existing watcher was updated, false otherwise.
             */
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

        return !(find()) && append()
    }
}

module.exports = StockWatchers