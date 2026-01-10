// Module imports
const z = require(`zod`).z
const DataContainer = require(`../templates/data.js`)

/**
 * Stock symbol validation
 * 1-6 uppercase letters or dot
 */
const StockSybmolRegex = z.coerce.string().trim().regex(/^[A-Z.]{1,6}$/)

/**
 * Represents a stock quote with various financial data attributes.
 * Extends the DataContainer class to include schema validation.
 */
class StockQuote extends DataContainer {
	/**
	 * The stock symbol (e.g., "AAPL" for Apple Inc.).
	 * Must be 1-6 uppercase letters or a dot.
	 * @type {string}
	 */
	symbol;

	/**
	 * The change in stock price since the previous close.
	 * @type {number|null|undefined}
	 */
	change;

	/**
	 * The percentage change in stock price since the previous close.
	 * @type {number|null|undefined}
	 */
	changePercent;

	/**
	 * The closing price of the stock.
	 * @type {number|null|undefined}
	 */
	close;

	/**
	 * The highest price of the stock during the trading session.
	 * @type {number|null|undefined}
	 */
	high;

	/**
	 * The latest price of the stock.
	 * @type {number|null|undefined}
	 */
	latestPrice;

	/**
	 * The latest time the stock data was updated.
	 * Can be a Date object, ISO string, or a parsable string.
	 * @type {Date|string|null|undefined}
	 */
	latestTime;

	/**
	 * The latest volume of shares traded.
	 * @type {number|null|undefined}
	 */
	latestVolume;

	/**
	 * The lowest price of the stock during the trading session.
	 * @type {number|null|undefined}
	 */
	low;

	/**
	 * The opening price of the stock.
	 * @type {number|null|undefined}
	 */
	open;

	/**
	 * The previous closing price of the stock.
	 * @type {number|null|undefined}
	 */
	previousClose;

	/**
	 * The total volume of shares traded.
	 * @type {number|null|undefined}
	 */
	volume;

	/**
	 * The schema used for validating stock quote data.
	 * @type {z.ZodObject}
	 * @protected
	 */
	_schema = z.object({
		"symbol": StockSybmolRegex,
		"change": z.coerce.number().nullable().optional(),
		"changePercent": z.coerce.number().nullable().optional(),
		"close": z.coerce.number().gte(0).nullable().optional(),
		"high": z.coerce.number().gte(0).nullable().optional(),
		"latestPrice": z.coerce.number().gte(0).nullable().optional(),
		"latestTime": z.union([z.date(), z.iso.datetime(), z.iso.date(), z.coerce.string().refine(value => (value == null || !Number.isNaN(Date.parse(value))))]).nullable().optional(),
		"latestVolume": z.coerce.number().gte(0).nullable().optional(),
		"low": z.coerce.number().gte(0).nullable().optional(),
		"open": z.coerce.number().gte(0).nullable().optional(),
		"previousClose": z.coerce.number().gte(0).nullable().optional(),
		"volume": z.coerce.number().gte(0).nullable().optional()
	});

	/**
	 * Creates a new StockQuote instance.
	 * @param {Object} properties - The properties to initialize the stock quote with.
	 */
	constructor (properties) {
		super(properties, true);
		Object.assign(this, properties)
	}
}

module.exports = {
	StockQuote, 
	StockSybmolRegex
}