/**
 * Registered errors that can be thrown back to the user.
 * Maps logical error categories to error classes exported by other modules.
 * @constant {Object}
 * @property {Object} fetching - Errors thrown by fetching logic (from ../outgoing/fetch.js).
 * @property {Function} validation - Validation error constructor (ZodError).
 */
const Errors = {
    "fetching": require(`../outgoing/fetch.js`).Errors,
    "validation": require(`zod`).z.ZodError
}

/**
 * Registry of valid response types produced by manager modules.
 * Used to detect the kind of result returned so it can be converted to a response format.
 * @constant {Object}
 * @property {Function} comparison - Constructor for comparison results (`ManagersComparisonResult`).
 * @property {Function} single - Constructor for single stock results (`ManagersResult`).
 */
const Responses = {
    "comparison": require(`../../manager/managers.js`).ManagersComparisonResult,
    "single": require(`../../manager/managers.js`).ManagersResult
}

/**
 * Formats container.
 * Holds constructors/factories for various response and error formats used by OutputProcessor.
 * Static properties reference the modules that construct formatted payloads.
 *
 * @example
 * // Access a formatted response constructor:
 * const StockFmt = Formats.response.stockData;
 */
class Formats {
    /** @type {Object} Module exposing response format constructors (e.g. `stockData`, `comparedStockData`) */
    static response = require(`./data/response.js`);
    static error = require(`./data/error.js`);
};

/**
 * OutputProcessor
 * Converts internal manager outputs and thrown errors into response-friendly formats.
 *
 * Typical responsibilities:
 * - Run an async callback that produces a manager result.
 * - Catch known errors and wrap them into a Formats.error instance.
 * - Convert manager result instances into Formats.response.* instances.
 *
 * @class OutputProcessor
 */
class OutputProcessor {
    /**
     * Current content held by the processor.
     * Can be a formatted error, a formatted single stock response, a formatted comparison response, or a raw value in other cases.
     *
     * @type {Formats.error|Formats.response.stockData|Formats.response.comparedStockData|any}
     */
    content;

    /**
     * Get a response-ready message object.
     *
     * If content is a Formats.error instance, returns `{ error: <error-format> }`.
     * If content is a formatted stock response or comparison response, returns `{ stockData: <data> }`.
     * Otherwise returns the raw content.
     *
     * @returns {Object|any} Response payload appropriate for sending to clients.
     */
    get message() {
        if (this.content instanceof Formats.error) {
            return {"error": this.content};
        } else if ([Formats.response.stockData, Formats.response.comparedStockData].some((value) => (this.content instanceof value))) {
            return {"stockData": this.content?.stockData || this.content};
        } else {
            return this.content;
        }
    };

    /**
     * Execute an async callback and process its result or any thrown known errors.
     *
     * The first argument to this method is expected to be the callback function. Any additional arguments passed to execute(...) are forwarded to the callback.
     * 
     * Known errors (`fetching.Connection`, `fetching.NotFound`, `ZodError`) are caught and wrapped in `Formats.error`. Unknown errors are re-thrown.
     *
     * If the callback returns a manager result, it is converted into the appropriate `Formats.response.*` instance.
     *
     * @param {Function} callback - Async function to execute (should return a manager result).
     * @param {...any} [args] - Arguments forwarded to the callback.
     * @returns {Promise<Formats.error|Formats.response.stockData|Formats.response.comparedStockData|any>} The processed content.
     *
     * @example
     * const proc = new OutputProcessor();
     * await proc.execute(asyncFunction, arg1, arg2);
     * // then proc.message can be used to get a response-ready payload
     */
    async execute(callback) {
        let result; 
        try {
            result = await callback(...Array.from(arguments).slice(1))
        } catch(error) {
            console.error(error)
            if ([Errors.fetching.Connection, Errors.fetching.NotFound, Errors.validation].some((value) => (error instanceof value))) {
                this.content = new Formats.error(error)
            } else {
                throw error;
            };
        };

        if (result) {
            if (result instanceof Responses[`single`]) {
                this.content = new Formats.response.stockData(result)
            } else if (result instanceof Responses['comparison']) {
                this.content = new Formats.response.comparedStockData(result)
            };
        };

        return this.message;
    };

    /**
     * Create a new `OutputProcessor`.
     *
     * @constructor
     * @param {any} [output] - Optional initial content to seed the processor with.
     */
    constructor(output) {
        output && (this.content = output);
    };
};

module.exports = {Formats, OutputProcessor};