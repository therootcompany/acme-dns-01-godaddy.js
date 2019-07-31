'use strict';

var request; // = require('@root/request');
// request = require('util').promisify(request);

var OTE_ENVIRONMENT = 'https://api.ote-godaddy.com/v1/';
var PRODUCTION_ENVIRONMENT = 'https://api.godaddy.com/v1/';

var defaults = {
	baseUrl: PRODUCTION_ENVIRONMENT
};

module.exports.create = function(config) {
	var baseUrl = config.baseUrl || defaults.baseUrl;
	var apiKey = config.key || config.apiKey;
	var apiSecret = config.secret || config.apiSecret;

	var auth = 'sso-key ' + apiKey + ':' + apiSecret;

	function api(method, path, form) {
		return request({
			method: method,
			url: baseUrl + path,
			headers: {
				Authorization: auth
			},
			json: form || true
		});
	}

	return {
		init: function(deps) {
			request = deps.request;
			return null;
		},

		zones: function(data) {
			return api('GET', 'domains?statuses=ACTIVE').then(function(resp) {
				if (200 !== resp.statusCode) {
					console.error(resp.statusCode);
					console.error(resp.body);
					throw new Error('Could not get list of zones. Check api key, etc');
				}

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

			return api('PATCH', 'domains/' + ch.dnsZone + '/records', records).then(
				function(resp) {
					if (200 !== resp.statusCode) {
						console.error(resp.statusCode);
						console.error(resp.body);
						throw new Error(
							'record did not set. check subdomain, api key, etc'
						);
					}

					return true;
				}
			);
		},
		remove: function(data) {
			var ch = data.challenge;

			// get all domain records of type or name
			return api(
				'GET',
				'domains/' + ch.dnsZone + '/records/TXT/' + ch.dnsPrefix
			)
				.then(function(resp) {
					if (200 !== resp.statusCode) {
						console.error(resp.statusCode);
						console.error(resp.body);
						throw new Error('Could not get list of zones. Check api key, etc');
					}

					var newEntries = [];
					// filter all TXT records without record to remove
					for (let i = 0; i < resp.body.length; i++) {
						if (resp.body[i]['data'] !== ch.dnsAuthorization) {
							newEntries.push(resp.body[i]);
						}
					}
					return newEntries;
				})
				.then(function(newRecords) {
					// godaddy doesn't provide an endpoint for a single record removal
					// but provides this endpoint to replace all records of a given type
					// https://developer.godaddy.com/doc/endpoint/domains#/v1/recordReplaceType
					// however, calling the endpoint with no records does no changes
					// hence when only a single record of type exists and is the one to remove
					// we call the endpoint with this dummy record

					if (!newRecords.length) {
						newRecords.push({
							data: 'free_to_delete',
							name: 'remove_placeholder',
							ttl: 600
						});
					}

					// update - overwrite all type and name records under domain
					return api(
						'PUT',
						'domains/' + ch.dnsZone + '/records/TXT',
						newRecords
					).then(function(resp) {
						if (200 !== resp.statusCode) {
							console.error(resp.statusCode);
							console.error(resp.body);
							throw new Error(
								'record did not remove. check subdomain, api key, etc'
							);
						}
						return true;
					});
				});
		},
		get: function(data) {
			var ch = data.challenge;
			return api(
				'GET',
				'domains/' + ch.dnsZone + '/records/TXT/' + ch.dnsPrefix
			).then(function(resp) {
				resp = resp.body;

				var entry = null;

				if (resp.length) {
					entry = resp.filter(function(x) {
						return x.data === ch.dnsAuthorization;
					})[0];
				}

				return entry ? { dnsAuthorization: entry.data } : null;
			});
		}
	};
};
