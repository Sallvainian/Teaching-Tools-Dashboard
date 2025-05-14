#!/bin/bash

# Create the Qodana coverage directory if it doesn't exist
mkdir -p .qodana/code-coverage

# When tests are run, coverage data is stored in the coverage directory
# We need to copy the lcov.info file to where Qodana expects it
if [ -f "coverage/lcov.info" ]; then
  cp coverage/lcov.info .qodana/code-coverage/
  echo "Coverage data copied to .qodana/code-coverage/"
else
  echo "No coverage data found. Run 'pnpm test' first."
fi