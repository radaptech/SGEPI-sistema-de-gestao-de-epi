# --renew-anon-volumes: o node_modules do front (volume anônimo) vem sempre da imagem nova,
# senão uma dependência trocada no package.json não aparece no container
init:
	@docker compose -f docker-compose.dev.yml up -d --build --renew-anon-volumes
e2e:
	@cd e2e && npx playwright test
