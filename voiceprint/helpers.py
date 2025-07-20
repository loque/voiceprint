def sanitize_name(name: str) -> str:
    """Convert name to valid Unix filename."""
    return name.replace(' ', '_').replace('-', '_').replace('/', '_').replace('\\', '_').lower()