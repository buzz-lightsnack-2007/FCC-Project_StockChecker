const z = require(`zod`).z
const ManagersResult = require(`../../../manager/managers.js`).ManagersResult
const ManagersComparisonResult = require(`../../../manager/managers.js`).ManagersComparisonResult

/**
 * Class representing a single stock's data, intended for responses
 *
 * @class stockData
 * @classdesc Holds a stock symbol, its latest price, and the current like count.
 *
 * @property {string} stock - The stock symbol (e.g., "AAPL").
 * @property {number} price - The latest known price for the stock.
 * @property {number} likes - Number of likes/watchers associated with the stock.
 */
class stockData {
	/**
	 * The stock symbol
	 * @type {String}
	 */
	stock = "";

	/**
	 * The latest stock price
	 * @type {Number}
	 */
	price = 0;

	/**
	 * The count of watchers in the current instance
	 * @type {Number}
	 */
	likes = 0;
	
	/**
	 * Import and populate this stockData instance from a ManagersResult payload.
	 *
	 * The function validates/parses the incoming ManagersResult and maps fields:
	 * - data.stocks.symbol → this.stock
	 * - data.stocks.latestPrice → this.price
	 * - data.watchers.length → this.likes
	 *
	 * @param {ManagersResult} data - The incoming managers result to import.
	 * @returns {stockData} The current instance after importing data (for chaining).
	 * @throws {Error} If the provided data is not a valid ManagersResult (validation may throw).
	 * @public
	 */
	_import(data) {
		z.instanceof(ManagersResult).parse(data);
		this.stock = data.stocks.symbol;
		this.price = data.stocks.latestPrice;
		this.likes = data.watchers.length;
		
		return this;
	}

	/**
	 * @constructor
	 * @param {ManagersResult} data - The incoming manager’s result to import.
	 */
	constructor(data) {
		data && (this._import(data));
	}
}

/**
 * comparedStockData
 * @class comparedStockData
 * @classdesc Adapter that transforms a ManagersComparisonResult into an array of plain stock
 * objects suitable for output. For each symbol name in the comparison result it constructs a
 * new stockData instance, removes any properties whose keys include the substring "like",
 * and appends a numeric "rel_likes" property taken from the comparison.watchers map.
 *
 * @example
 * const adapter = new comparedStockData(managersComparisonResult);
 * const list = adapter.stockData; // [{ symbol: 'ABC', price: 123, rel_likes: 5 }, ...]
 */
class comparedStockData {
	/**
	 * Get the transformed stock data array.
	*
	* Returns an array where each element is a plain object derived from a stockData instance for a given symbol. Properties whose keys contain "like" are filtered out and a "rel_likes" numeric property (sourced from comparison.watchers) is added.
	*
	* @type {Array<Record<string, *>>}
	* @readonly
	* @throws {Error} If the internal data has not been set or is invalid.
	*/
	get stockData() {
		return (this.#data.names.map((name) => Object.fromEntries(
				[...Object.entries(
					new stockData(this.#data.data[name])
				).filter((record) => (!(record[0].includes(`like`)))), 
				[`rel_likes`, this.#data.comparison.watchers[name]]
			])
		));
	}

	/**
	 * Internal parsed comparison result.
	 *
	 * This private field holds the validated ManagersComparisonResult passed into the instance.
	 * Expected shape (illustrative):
	 * {
	 *   names: string[],
	 *   data: Record<string, unknown>,                 // keyed by symbol/name
	 *   comparison: { watchers: Record<string, number> }
	 * }
	 *
	 * @type {ManagersComparisonResult}
	 * @private
	 */
	#data; 
	
	/**
	 * Internal parsed comparison result.
	 *
	 * This private field holds the validated ManagersComparisonResult passed into the instance.
	 * Expected shape (illustrative):
	 * {
	 *   names: string[],
	 *   data: Record<string, unknown>,                 // keyed by symbol/name
	 *   comparison: { watchers: Record<string, number> }
	 * }
	 *
	 * @type {ManagersComparisonResult}
	 */
	get data() {
	   return (this.#data);
	}
	
	/**
	 * The setter validates the provided value using z.instanceof(ManagersComparisonResult).parse(data)
	 * and will throw if validation fails.
	 *
	 * @param {ManagersComparisonResult} data - The incoming comparison result to import.
	 */
	set data(data) {
		this.#data = z.instanceof(ManagersComparisonResult).parse(data);
	}

	/**
	 * Create a comparedStockData instance.
	 * If the optional data parameter is provided it will be validated and stored via the data setter.
	 * 
	 * @constructor
	 * @param {ManagersComparisonResult} [data] - Optional initial comparison result to import.
	 */
	constructor(data) {
		data && (this.data = data);
	}
};

module.exports = {stockData, comparedStockData};