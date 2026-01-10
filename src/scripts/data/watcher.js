/**
 * @module watcher
 *
 * @constant {import("zod").ZodAny} z - Zod namespace used to build validation schemas.
 * @constant {typeof DataContainer} DataContainer - Base class providing generic data container behavior.
 * @constant {typeof StockQuote} StockQuote - Class representing a stock quote entity.
 */
const z = require(`zod`).z
const DataContainer = require(`../templates/data.js`)
const StockQuote = require(`./stock.js`).StockQuote

/**
 * Class representing a watcher entry that ties a StockQuote to an associated hostname.
 *
 * @class Watcher
 * @extends DataContainer
 * @classdesc Holds the watched stock and its associated address and enforces shape via a zod schema.
 */
class Watcher extends DataContainer {
	/**
	 * The stock being watched.
	 * @name Watcher#stock
	 * @type {StockQuote[]}
	 * @description Instance of StockQuote representing the symbols and quote details monitored by this watcher.
	 */
	stock = []
	
	/**
	 * The hostname or address associated with this watcher.
	 * @name Watcher#address
	 * @type {string}
	 * @description Hostname string used to identify the origin or target associated with the watched stock.
	 */
	address;

	/**
	 * Internal validation schema for Watcher instances.
	 * @name Watcher#_schema
	 * @type {import("zod").ZodObject}
	 * @description Zod object schema that validates that `stock` is an instance of StockQuote and `address` is a hostname.
	 * @protected
	 */
	_schema = z.object({
		"stock": z.array(z.instanceof(StockQuote)),
		"address": z.hostname()
	})

	/**
	 * Constructs a new Watcher.
	 *
	 * @function Watcher#constructor
	 * @param {Object} properties - Properties to initialize the Watcher.
	 * @param {StockQuote[]} properties.stock - StockQuote instance to be watched.
	 * @param {string} properties.address - Hostname associated with the watcher.
	 * @returns {Watcher} A newly constructed Watcher instance.
	 */
	constructor (properties) {
		super(properties)
		(strict || this._schema.safeParse().success) ? Object.assign(this, this._validate(properties)) : false;
	}
}

module.exports = Watcher