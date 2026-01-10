const z = require(`zod`).z

/**
 * Container for validated data objects.
 * Provides a simple instance that holds properties validated and parsed by an internal Zod schema.
 * @class DataContainer
 */
class DataContainer {
	/**
	 * Internal Zod schema used to validate and parse incoming objects before assignment.
	 * By default, initialized to an empty, loose object schema
	 * 
	 * @name DataContainer#_schema
	 * @type {import("zod").ZodObject<any, any, any>}
	 */
	_schema = z.object({}).loose()

	get _validate() {
		/**
		 * Validate the passed properties against the schema. 
		 */
		return this._schema.parse
	}

	constructor(properties = {}, strict = false) {
		/**
		 * Create a new DataContainer instance.
		 * Attempts a safe parse of the provided properties with the internal schema; if the parse is successful,
		 * the parsed properties are assigned to the instance using Object.assign.
		 * @param {Object} [properties={}] - Initial properties to validate and assign to the container.
		 * @param {Boolean} [strict=false] - Determines whether an error should be thrown if the input data doesn’t satisfy the schema. 
		 */
		(strict || this._schema.safeParse().success) ? Object.assign(this, this._validate(properties)) : false;
	}
}

/**
 * Module export: the DataContainer class.
 * @module src/scripts/templates/data
 * @exports DataContainer
 */
module.exports = DataContainer