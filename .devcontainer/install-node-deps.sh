#!/bin/bash
set -e

# Install @antfu/ni globally
npm i -g @antfu/ni

# Install web_ui dependencies
(cd web_ui && nci)
