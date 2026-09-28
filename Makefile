.PHONY: test sim recompute verify-chain verify-public

test:
	npm test

sim:
	node sim/run.js

recompute:
	node scripts/ewje-cli.js recompute $(EVENT)

verify-chain:
	node scripts/ewje-cli.js verify-chain $(EVENT)

verify-public:
	node scripts/ewje-cli.js verify-public
