.PHONY: openapi clean help

# Generate OpenAPI JSON schema
openapi:
	python rest_api/openapi.py --pretty -o web_ui/openapi.json
	cd web_ui && npm run generate:openapi
	@echo "✅ OpenAPI schema generated and TypeScript types updated successfully!"

# Clean generated files
clean:
	rm -f web_ui/openapi.json

# Show available targets
help:
	@echo "Available targets:"
	@echo "  openapi    - Generate OpenAPI JSON schema"
	@echo "  clean      - Remove generated files"
	@echo "  help       - Show this help message"