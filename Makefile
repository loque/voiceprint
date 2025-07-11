.PHONY: openapi clean help

# Generate OpenAPI JSON schema
openapi:
	python rest_api/openapi.py --pretty -o openapi.json

# Clean generated files
clean:
	rm -f openapi.json

# Show available targets
help:
	@echo "Available targets:"
	@echo "  openapi    - Generate OpenAPI JSON schema"
	@echo "  clean      - Remove generated files"
	@echo "  help       - Show this help message"