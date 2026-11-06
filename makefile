init:
	@docker compose -f docker-compose.dev.yml up -d --build
e2e:
	@cd e2e && npx playwright test
