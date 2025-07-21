.PHONY: openapi clean help rest_api web_ui

# Generate OpenAPI JSON schema
openapi:
	python rest_api/openapi.py --pretty -o web_ui/openapi.json
	cd web_ui && npm run generate:openapi
	@echo "✅ OpenAPI schema generated and TypeScript types updated successfully!"

# Clean generated files
clean:
	rm -f web_ui/openapi.json

rest_api:
	LIBS_PATH=./downloads uvicorn rest_api.api:api --host 0.0.0.0 --port 9797

web_ui:
	cd web_ui && npm run dev

# Show available targets
help:
	@echo "Available targets:"
	@echo "  openapi    - Generate OpenAPI JSON schema"
	@echo "  clean      - Remove generated files"
	@echo "  rest_api   - Start the REST API server"
	@echo "  web_ui     - Start the Web UI development server"
	@echo "  help       - Show this help message"