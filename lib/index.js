'use strict';

var request; // = require('@root/request');
// request = require('util').promisify(request);

var OTE_ENVIRONMENT = 'https://api.ote-godaddy.com/v1/';
var PRODUCTION_ENVIRONMENT = 'https://api.godaddy.com/v1/';

var defaults = {
	baseUrl: PRODUCTION_ENVIRONMENT
};

module.exports.create = function(config) {
	var baseUrl = (config.baseUrl || defaults.baseUrl).replace(/\/$/, '');
	var apiKey = config.key || config.apiKey;
	var apiSecret = config.secret || config.apiSecret;

	var auth = 'sso-key ' + apiKey + ':' + apiSecret;
	var redacted = 'sso-key ' + apiKey + ':[redacted]';

	return {
		init: function(deps) {
			request = deps.request;
			return null;
		},

		zones: function(data) {
			return api('GET', '/domains?statuses=ACTIVE').then(function(resp) {
				return resp.body.map(function(x) {
					return x.domain;
				});
			});
		},
		set: function(data) {
			var ch = data.challenge;
			var txt = ch.dnsAuthorization;
			// If the domain to be verified is

			// optional params commented
			var records = [
				{
					data: txt,
					name: ch.dnsPrefix,
					// "port": 0,
					// "priority": 0,
					// "protocol": "string",
					// "service": "string",
					ttl: 600,
					type: 'TXT'
					// "weight": 0
				}
			];

			return api('PATCH', '/domains/' + ch.dnsZone + '/records', records).then(
				function(resp) {
					return null;
				}
			);
		},
		remove: function(data) {
			var ch = data.challenge;

			// get all domain records of type or name
			return api(
				'GET',
				'/domains/' + ch.dnsZone + '/records/TXT/' + ch.dnsPrefix
			)
				.then(function(resp) {
					// keep all TXT records that we don't need to remove
					return resp.body.filter(function(el) {
						return el.data !== ch.dnsAuthorization;
					});
				})
				.then(function(records) {
					// godaddy doesn't provide an endpoint for a single record removal
					// but provides this endpoint to replace all records of a given type
					// https://developer.godaddy.com/doc/endpoint/domains#/v1/recordReplaceType
					// however, calling the endpoint with no records does no changes
					// hence when only a single record of type exists and is the one to remove
					// we call the endpoint with this dummy record

					if (!records.length) {
						records.push({
							data: 'free_to_delete',
							name: 'remove_placeholder',
							ttl: 600
						});
					}

					// update - overwrite all type and name records under domain
					return api(
						'PUT',
						'/domains/' + ch.dnsZone + '/records/TXT',
						records
					).then(function(resp) {
						return null;
					});
				});
		},
		get: function(data) {
			var ch = data.challenge;
			return api(
				'GET',
				'/domains/' + ch.dnsZone + '/records/TXT/' + ch.dnsPrefix
			).then(function(resp) {
				var entry = (resp.body || []).filter(function(x) {
					return x.data === ch.dnsAuthorization;
				})[0];

				if (entry) {
					return { dnsAuthorization: entry.data };
				}

				return null;
			});
		}
	};

	function api(method, path, data) {
		var req = {
			method: method,
			url: baseUrl + path,
			headers: { Authorization: auth },
			json: data || true
		};
		return request(req).then(function(resp) {
			if (resp.statusCode < 200 || resp.statusCode >= 300) {
				req.headers.Authorization = redacted;
				console.error();
				console.error(req.method + ' ' + req.url);
				console.error(req.headers);
				if (data) {
					console.error(data);
				}
				console.error();
				console.error(resp.statusCode);
				console.error(resp.body);
				console.error();
				throw new Error(
					'Request "' +
						req.method +
						' ' +
						req.url +
						'" failed: ' +
						resp.statusCode +
						' ' +
						JSON.stringify(resp.body) +
						'. Check subdomain, api key, etc'
				);
			}
		});
	}
};
