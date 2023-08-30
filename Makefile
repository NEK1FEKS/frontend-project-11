install:
	npm ci

publish:
	npm publish --dry-run
	npm link --force

develop:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack

lint:
	npx eslint .
