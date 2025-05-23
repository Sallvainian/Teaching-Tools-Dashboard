#!/bin/bash

# Create .qodana directory if it doesn't exist
mkdir -p .qodana

# Copy coverage reports to Qodana directory
if [ -f "coverage/lcov.info" ]; then
  cp coverage/lcov.info .qodana/
  echo "Copied lcov.info to .qodana/"
fi

if [ -f "coverage/coverage-final.json" ]; then
  cp coverage/coverage-final.json .qodana/
  echo "Copied coverage-final.json to .qodana/"
fi

# Generate a coverage summary for Qodana
if [ -f "coverage/coverage-summary.json" ]; then
  cp coverage/coverage-summary.json .qodana/
  echo "Copied coverage-summary.json to .qodana/"
fi

echo "Coverage files copied to .qodana directory for Qodana analysis"