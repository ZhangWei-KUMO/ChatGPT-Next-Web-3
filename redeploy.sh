#!/bin/bash

# Stop yarn process managed by pm2
pm2 stop yarn

# Pull the latest changes from your git repository
git pull

# Build your project using yarn
yarn build

# Restart yarn using pm2
pm2 restart yarn
