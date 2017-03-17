#!/bin/bash

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
grunt build:production --force

# the dist/ directory is in my .gitignore, forcibly add it
git add -f public/dist

# the modules/core/client/css/core.css file is in my .gitignore, forcibly add it
git add -f modules/core/client/css/core.css

git commit -m "Deploying to EC2 Staging"
# Push it up to heroku, the -f ensures that heroku won't complain

#  Start heroku deployment
git push -f origin deploy
echo "Build complete\n---------- Pushed to 'deploy' branch ----------\n"

# With npm install
# ssh deploy@52.212.40.31 'cd /var/apps/insight-heroes; git checkout master; git branch -D deploy; git checkout -b deploy; git pull -u origin deploy; npm install; pm2 restart 1'

# With bower install
# ssh deploy@52.212.40.31 'cd /var/apps/insight-heroes; git checkout master; git branch -D deploy; git checkout -b deploy; git pull -u origin deploy; bower install; pm2 restart 1'

# With npm & bower install
echo "Updating code & installing plugins\n"
ssh deploy@52.212.40.31 'cd /var/apps/insight-heroes; git reset --hard; git checkout master; git branch -D deploy; git checkout -b deploy; git pull -u origin deploy; npm install; bower install; pm2 restart 1'

# Without npm & bower
# ssh deploy@52.212.40.31 'cd /var/apps/insight-heroes; git checkout master; git branch -D deploy; git checkout -b deploy; git pull -u origin deploy; pm2 restart 1'

# This file gets modified during deployment
git checkout config/assets/default.js
git checkout modules/questions/client/css/question-form.css

# Remove Dist directory
rm -fr dist/

echo "Deployment complete\n---------- Switching to 'staging' branch ----------\n"
git checkout staging

