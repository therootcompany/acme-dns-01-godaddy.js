#!/usr/bin/env node
'use strict';

// See https://git.coolaj86.com/coolaj86/acme-challenge-test.js
var tester = require('acme-challenge-test');
require('dotenv').config();

// Usage: node ./test.js example.com xxxxxxxxx
var zone = process.argv[2] || process.env.ZONE;
var challenger = require('./index.js').create({
	key: process.argv[3] || process.env.KEY,
	secret: process.argv[4] || process.env.SECRET,
	baseUrl: process.argv[5] || process.env.BASE_URL
});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
tester
	.testZone('dns-01', zone, challenger)
	.then(function() {
		console.info('PASS', zone);
	})
	.catch(function(e) {
		console.error(e.message);
		console.error(e.stack);
	});
