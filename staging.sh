#!/bin/bash

echo "------------------\nWe are not using heroku, \nTry 'sh ec2-staging.sh' to deploy on EC2 staging \n------------------\n"
exit 1

# ==========================================================

set -e
if [ `git branch --list deploy` ]
then
  # Delete current deploy branch
  git branch -D deploy
fi

# Switch to staging branch
git checkout staging

# Create new deploy branch based on Staging
git checkout -b deploy

echo "---------- Generating dist files ----------\n"
# Grunt comands to build our site
grunt build:production

# the dist/ directory is in my .gitignore, forcibly add it
git add -f public/dist

# the modules/core/client/css/core.css file is in my .gitignore, forcibly add it
git add -f modules/core/client/css/core.css

git commit -m "Deploying to Heroku"
# Push it up to heroku, the -f ensures that heroku won't complain

#  Start heroku deployment
echo "Build complete\n---------- Heroku Staging deployment ----------\n"
git push heroku -f deploy:master

# This file gets modified during deployment
git checkout config/assets/default.js

# Switch it back to master
echo "Deployment complete\n---------- Switching back to staging branch ----------\n"
git checkout staging

# Remove Dist directory
rm -fr dist/

# Run database migration
# echo "\n---------- Executing DB migration ----------"
