const StockSybmolRegex = require(`../../data/stock.js`).StockSybmolRegex
const StockQuote = require(`../../data/stock.js`).StockQuote

const NotFoundError = require(`common-errors`).NotFoundError;
const ConnectionError = require(`common-errors`).ConnectionError;

/**
 * Class responsible for fetching stock quote data for a given stock symbol.
 *
 * Uses StockSybmolRegex.parse to normalize/validate symbols and fetches data
 * from the FreeCodeCamp stock price proxy endpoint. Returns a StockQuote instance
 * built from the remote response.
 *
 * @class StockFetcher
 * @see {@link StockSybmolRegex}
 * @see {@link StockQuote}
 */
class StockFetcher {
	/**
	 * Internal storage for the current stock symbol (possibly normalized).
	 *
	 * @private
	 * @type {string|undefined}
	 * @name #sybmol
	 * @memberof StockFetcher
	 * @default ''
	 */
	#sybmol = '';

	/**
	 * Create a StockFetcher.
	 *
	 * @param {string|undefined} [symbol] - Optional initial stock symbol. If provided, it’ll be parsed/normalized via StockSybmolRegex.parse and stored.
	 */
	constructor(symbol = undefined) {
		symbol ? this.symbol = symbol : false;
	}

	/**
	 * Get the current stock symbol.
	 *
	 * Returns the internally stored (possibly parsed) symbol; may be undefined if
	 * no symbol has been set.
	 *
	 * @name symbol
	 * @memberof StockFetcher#
	 * @type {string|undefined}
	 * @returns {string|undefined} The parsed/normalized stock symbol or undefined.
	 */
	get symbol() {
		return this.#sybmol
	}

	/**
	 * Set the current stock symbol.
	 *
	 * The provided value is parsed/normalized using StockSybmolRegex.parse before
	 * being stored. Passing a falsy value will clear the stored symbol (set to undefined).
	 *
	 * @name symbol
	 * @memberof StockFetcher#
	 * @param {string|undefined} symbol - The stock symbol to set (raw input).
	 * @returns {string|undefined} The parsed/normalized symbol stored, or undefined.
	 * @throws {Error} Propagates any errors thrown by StockSybmolRegex.parse for invalid input.
	 */
	set symbol(symbol) {
		this.#sybmol = (symbol) ? StockSybmolRegex.parse(symbol) : undefined
		return this.#sybmol
	}

	/**
	 * Construct the network source URL for the currently stored symbol.
	 *
	 * This getter builds the full proxy URL used to request the stock quote. If
	 * no symbol is set, StockSybmolRegex.parse may be invoked with undefined and
	 * its behavior will determine the produced URL.
	 *
	 * @name source
	 * @memberof StockFetcher#
	 * @type {string}
	 * @readonly
	 * @returns {string} Fully-qualified URL to fetch the stock quote for the current symbol.
	 */
	get source() {
		return `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${StockSybmolRegex.parse(this.#sybmol)}/quote`
	};

	/**
	 * Fetch the stock quote for the current symbol from the remote API.
	 *
	 * Performs an HTTP GET against the URL produced by the `source` getter, parses
	 * the JSON response and wraps it in a StockQuote instance.
	 *
	 * @async
	 * @memberof StockFetcher#
	 * @function fetch
	 * @param {boolean} [verbose=true] Sets the verbose mode; logs are never sent to the client. 
	 * @returns {Promise<StockQuote>} A promise that resolves to a StockQuote built from the response.
	 * @throws {ReferenceError} If the HTTP response has a non-OK status (includes status code in the message).
	 * @throws {SyntaxError} If the response body represents an error string (response parsed as a string).
	 * @throws {TypeError|Error} May throw other errors related to network failure or JSON parsing.
	 */
	async fetch(verbose = true) {
		/**
		 * 
		 * @param {Error|String|Number} status 
		 */
		function onConnectionError(status) {
			throw (() => {
				let error = new ConnectionError(
					...((typeof(status)).includes(`obj`) ? [error.message, error] : [error, undefined])
				);
				(typeof(status)).includes(`obj`) && (() => {
					error.stack = status?.stack;
					error.cause = status?.cause;
					error.code = status?.code;
				})();
				return error;
			});
		};

		verbose && console.log(`\x1b[33mConnecting to \x1b[1m${this.source}\x1b[22m\x1b[5m…\x1b[0m`)
		let fetcher = await fetch(this.source);
		(!fetcher.ok) && onConnectionError(fetcher.status);

		verbose && console.log(`\x1b[F\x1b[KConnected to ${this.source}. \n\x1b[1m\x1b[33mReceiving response\x1b[22m from ${this.source}\x1b[5m…\x1b[0m`) // move cursor up one line, clear it, then print "connected" replacing the previous line
		let response; 
		try {
			response = JSON.parse(await fetcher.text())
			if ((typeof(response)).includes(`str`)) {
				if (response.includes(`symbol`)) {
					throw new NotFoundError(this.#sybmol);
				} else {
					onConnectionError("Unknown message received.");
				};
			};
		} catch(error) {
			if (error instanceof SyntaxError) {
				onConnectionError(error);
			} else {
				throw error;
			};
		};
		verbose && console.log(`\x1b[F\x1b[K\x1b[32mReceived response from ${this.source}.\x1b[0m`); // move cursor up one line, clear it, then print "connected" replacing the previous line
		
		return new StockQuote(response)
	};
};

StockFetcher.Errors = class {
	static NotFound = NotFoundError;
	static Connection = ConnectionError;
}

module.exports = StockFetcher;