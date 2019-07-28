# [acme-dns-01-godaddy](https://git.rootprojects.org/root/acme-dns-01-godaddy.js) | a [Root](https://rootprojects.org) project

Godaddy DNS + Let's Encrypt for Node.js

This handles ACME dns-01 challenges, compatible with ACME.js and Greenlock.js.
Passes [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js).

# Install

```bash
npm install --save acme-dns-01-godaddy@3.x
```

# Usage

First you create an instance with your API token:

```js
var dns01 = require('acme-dns-01-godaddy').create({
	baseUrl: 'https://api.godaddy.com', // default
	key: 'xxxx',
	secret: 'xxxx'
});
```

Then you can use it with any compatible ACME module,
such as Greenlock.js or ACME.js.

### Greenlock.js

```js
var Greenlock = require('greenlock-express');
var greenlock = Greenlock.create({
	challenges: {
		'dns-01': dns01
		// ...
	}
});
```

See [Greenlock™ Express](https://git.rootprojects.org/root/greenlock-express.js)
and/or [Greenlock.js](https://git.rootprojects.org/root/greenlock.js) documentation for more details.

### ACME.js

```js
// TODO
```

See the [ACME.js](https://git.rootprojects.org/root/acme-v2.js) for more details.

### Build your own

```js
dns01
	.set({
		identifier: { value: 'foo.example.com' },
		wildcard: false,
		dnsHost: '_acme-challenge.foo.example.com',
		dnsAuthorization: 'xxx_secret_xxx'
	})
	.then(function() {
		console.log('TXT record set');
	})
	.catch(function() {
		console.log('Failed to set TXT record');
	});
```

See [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js)
for more implementation details.

# Tests

```bash
# node ./test.js domain-zone api-key api-secret
node ./test.js example.com xxxxxx xxxxxx
```
