#!/bin/bash
# Goose startup script with proper environment configuration

export GOOSE_PROVIDER=openai
export GOOSE_MODEL=gpt-4o

# Start goose with the configured environment
goose session "$@"