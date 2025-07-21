#!/usr/bin/env python3
"""
Script to generate OpenAPI JSON schema for the Voiceprint REST API.

This script imports the FastAPI application and outputs its OpenAPI schema
in JSON format to stdout or saves it to a file.
"""

import json
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the api module
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from rest_api.api import api
except ImportError as e:
    print(f"Error importing API: {e}", file=sys.stderr)
    print("Make sure you're running this script from the correct directory", file=sys.stderr)
    sys.exit(1)


def generate_openapi_schema() -> dict:
    """Generate the OpenAPI schema from the FastAPI application."""
    return api.openapi()


def main():
    """Main function to generate and output the OpenAPI schema."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate OpenAPI JSON schema for the Voiceprint REST API"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: stdout)",
        type=str
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty print the JSON output"
    )
    
    args = parser.parse_args()
    
    try:
        # Generate the OpenAPI schema
        schema = generate_openapi_schema()
        
        # Configure JSON output formatting
        json_kwargs = {}
        if args.pretty:
            json_kwargs.update({
                "indent": 2,
                "sort_keys": True
            })
        
        # Output the schema
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(schema, f, **json_kwargs)
            print(f"OpenAPI schema saved to: {args.output}", file=sys.stderr)
        else:
            print(json.dumps(schema, **json_kwargs))
            
    except Exception as e:
        print(f"Error generating OpenAPI schema: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
