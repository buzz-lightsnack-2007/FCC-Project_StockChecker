
const Routes = require(`../scripts/manager/routes.js`);
const OutputProcessor = require(`../scripts/net/incoming/input-output.js`).OutputProcessor;

const routes = new Routes();

module.exports = function (app) {
	/**
	 * Register API routes on the provided Express application.
	 *
	 * Wires a GET handler for '/api/stock-prices' that delegates to the Routes adapter
	 * and formats results/errors through the OutputProcessor before sending JSON.
	 *
	 * @param {import('express').Application} app - Express application instance to register routes on.
	 * @returns {void}
	 */
	app.route('/api/stock-prices')
	.get(async function (req, res){
			/**
			 * Express handler for GET /api/stock-prices.
			 *
			 * - Accepts query parameter `stock` which may be a string or an array of strings.
			 * - Recognizes watch-like flags (`like`, `watch`) in the query to trigger watch behaviour.
			 * - Uses req.ip to identify the requester when registering watchers.
			 * - Uses OutputProcessor to convert manager results or known errors into response payloads.
			 *
			 * @param {import('express').Request} req - Request object (request body): contains query parameters and client IP.
			 * @param {import('express').Response} res - Response object (response body): used to send the JSON payload (res.json).
			 * @returns {Promise<void>} Resolves once the JSON response has been sent.
			 */
      		let output = new OutputProcessor();
			let response = await output.execute(() => {
				return routes.any(req)
			});
			res.send(response);
    });
};
