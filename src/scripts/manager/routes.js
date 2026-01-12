/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').NextFunction} NextFunction */
/** @typedef {import('express').RequestHandler} RequestHandler */

const z = require(`zod`).z;
const Managers = require(`./managers.js`).Managers;

/**
 * Routes is an adapter between Express requests and the Managers API.
 *
 * It normalizes incoming Express Request objects into the parameters expected
 * by the Managers class and delegates operations (read, watch, compare).
 *
 * Instances are light-weight and encapsulate a single Managers instance which
 * performs the underlying business logic (fetching quotes, managing watchers).
 *
 * Example:
 *   const routes = new Routes();
 *   // within an Express handler:
 *   // res.json(await routes.read(req));
 *
 * @class Routes
 */
class Routes {
	/**
	 * Instance of Managers that performs the underlying business logic.
	 * This is an internal/private field and should not be accessed externally.
	 * @type {import('./managers.js').Managers}
	 * @private
	 */
	_manager; 

	/**
	 * Create a new Routes adapter and construct its Managers dependency.
	 * The Managers instance is created eagerly to encapsulate stateful managers.
	 * @constructor
	 */
	constructor() {
		this._manager = new Managers();
	}

	/**
	 * Extract the relevant parameters from an Express Request.
	 *
	 * - symbols: read from request.query.stock (may be a string, array of strings, or undefined)
	 * - address: read from request.ip (may be undefined in some environments)
	 *
	 * This method centralizes parsing so all route handlers use the same normalization.
	 *
	 * @private
	 * @param {Request} request Express request object
	 * @returns {{symbols: string|string[]|undefined, address: string|undefined}} Parsed parameters
	 * @example
	 * // request.query.stock === 'AAPL' -> { symbols: 'AAPL', address: '::1' }
	 * // request.query.stock === ['AAPL','MSFT'] -> { symbols: ['AAPL','MSFT'], address: '::1' }
	 */
	#fetch(request) {
		return {"symbols": request.query?.stock, "address": request?.ip} 
	}

	/**
	 * Read a single stock quote or delegate to compare when multiple symbols are provided.
	 *
	 * Behavior:
	 * - If request.query.stock is an array, delegates to this.compare(request).
	 * - Otherwise calls this._manager.read(symbol) and returns the result.
	 *
	 * Returns whatever the underlying Managers.read / compare return (typically a ManagersResult
	 * or ManagersComparisonResult wrapped in a Promise).
	 *
	 * @param {Request} request Express request object
	 * @returns {Promise<ManagersResult|ManagersComparisonResult>|ManagersResult|ManagersComparisonResult} Result from Managers.read or Routes.compare
	 */
	read(request) {
		return this._manager.read(request.query?.stock);
	}

	/**
	 * Register a watcher for the symbol associated with the incoming requester's address.
	 *
	 * Delegates to Managers.watch(symbol, address) after extracting parameters via #fetch.
	 * This will validate the symbol by reading it first (Managers.watch implementation does this).
	 *
	 * @param {Request} request Express request object
	 * @returns {Promise<ManagersResult>|ManagersResult} Result returned by Managers.watch
	 */
	watch(request) {
		return this._manager.watch(this.#fetch(request).symbols, this.#fetch(request).address);
	};

	/**
	 * Compare multiple stock symbols.
	 *
	 * Delegates to Managers.compare(symbols) using the symbols extracted from the request.
	 *
	 * @param {Request} request Express request object
	 * @returns {Promise<ManagersComparisonResult>|ManagersComparisonResult} Result returned by Managers.compare
	 */
	compare(request) {
		return this._manager.compare(this.#fetch(request).symbols);
	};

	/**
	 * Dynamically choose an operation (read, watch, or compare) based on request parameters.
	 *
	 * Selection logic:
	 * - If `query.stock` is an array ⇒ use compare
	 * - Else if a truthy query param named ‘like’ or ‘watch’ that coerces to boolean true exists ⇒ use watch
	 * - Otherwise ⇒ use read
	 *
	 * The local helper `willwatch` encapsulates the logic for detecting watch-like query flags.
	 *
	 * @param {Request} request Express request object
	 * @returns {Promise<ManagersResult|ManagersComparisonResult>|ManagersResult|ManagersComparisonResult} Result of the chosen route handler
	 */
	any(request) {
		/**
		 * Determine whether this request should be treated as a "watch" action.
		 *
		 * Checks for query parameters named ‘like’ or ‘watch’ that are present and coerce to boolean true (e.g. ‘true’, ‘1’, true, ‘anything’).
		 *
		 * @private
		 * @function willwatch
		 * @returns {boolean} true if request should perform a watch, false otherwise
		 */
		const willwatch = () => (request?.query && [`like`, `watch`].some((name) => (Object.keys(request?.query).includes(name) && request?.query[name] && [1, 'true', 'yes', '+'].includes(request?.query[name].toLocaleLowerCase()))));
		return this[willwatch() ? `watch` : ((Array.isArray(this.#fetch(request).symbols)) ? `compare` : `read`)](request);
	};
};

module.exports = Routes;