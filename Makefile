.PHONY: test lint typecheck format start clean

test:
	npm test -- --ci --passWithNoTests

lint:
	npm run lint

typecheck:
	npm run typecheck

format:
	npm run format

start:
	npx expo start

clean:
	rm -rf node_modules .expo dist
	npm ci --legacy-peer-deps
