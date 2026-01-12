/**
 * Error type used for failures during request processing.
 *
 * Extends the Error implementation from the `common-errors` package to provide HTTP-aware metadata (status code, description, numeric code) and to optionally wrap/propagate an underlying error or plain object describing an error.
 *
 * @extends {require('common-errors').Error}
 *
 * @example
 * // string message
 * new ProcessingError('unexpected input');
 *
 * @example
 * // wrapping an Error instance
 * new ProcessingError(new Error('database failure'));
 *
 * @example
 * // plain object with richer metadata
 * new ProcessingError({ name: 'DBError', message: 'conn failed', code: 503, stack: '...' });
 */
class ProcessingError extends require(`common-errors`).Error {
    /**
     * Short machine-friendly name for this error type.
     * @type {string}
     */
    name = "Processing-Error";

    /**
     * HTTP status code for the error response (default 500).
     * @type {number}
     */
    message = 500; // HTTP status code

    /**
     * Human-readable description/message to return to clients.
     * @type {string}
     */
    description = `Failed to process the request.`;

    /**
     * Numeric application-specific error code (defaults to 500).
     * May mirror an HTTP status code if provided by the wrapped error.
     * @type {number}
     */
    code = 500;

    /**
     * The underlying cause of this error, if any.
     * @type {any}
     */
    cause = undefined;

    /**
     * Create a ProcessingError.
     * 
     * If `error` is an object (typeof includes "obj"), properties from that object are used to populate this instance (name, message → description, code, stack, cause). If the provided `error.code` is an integer in the range 400-599 it will be used as the HTTP status (this.message).
     *
     * If `error` is a string or non-object Error-like value, it will be used as the human-readable `description` and the default status/code (500) will remain.
     *
     * @constructor
     * @param {(Error|Object|string)} error - The underlying error, an object
     * containing error metadata, or a plain string message.
     */
    constructor (error) {
        super(error?.message || error, (typeof(error)).includes(`obj`) ? error : undefined)
        if ((typeof(error)).includes(`obj`)) {
            this.name = error.name || `Processing-Error`;
            error?.message && (this.description = error?.message);
            error?.code && (this.code = error?.code);
            error?.cause && (this.cause = error?.cause);
            
            const codeNum = Number(error.code);
            (Number.isInteger(codeNum) && codeNum >= 400 && codeNum <= 599) && (this.message = codeNum);

            delete this["generateMessage"]
            delete this["args"]
        } else {
            this.description = error;
        };
    };
};

module.exports = ProcessingError;