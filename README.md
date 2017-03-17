# *Insight Heroes*
It is Survey application which contains feature of creating questions in a survey, getting user responses to questions. Its developed using MEAN stack.

## Before you begin
Before you begin we recommend you read about the basic building blocks that assemble a MEAN.JS application:
* MongoDB - Go through [MongoDB Official Website](http://mongodb.org/) and proceed to their [Official Manual](http://docs.mongodb.org/manual/), which should help you understand NoSQL and MongoDB better.
* Express - The best way to understand express is through its [Official Website](http://expressjs.com/), which has a [Getting Started](http://expressjs.com/starter/installing.html) guide, as well as an [ExpressJS](http://expressjs.com/en/guide/routing.html) guide for general express topics. You can also go through this [StackOverflow Thread](http://stackoverflow.com/questions/8144214/learning-express-for-node-js) for more resources.
* AngularJS - Angular's [Official Website](http://angularjs.org/) is a great starting point. You can also use [Thinkster Popular Guide](http://www.thinkster.io/), and [Egghead Videos](https://egghead.io/).
* Node.js - Start by going through [Node.js Official Website](http://nodejs.org/) and this [StackOverflow Thread](http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js), which should get you going with the Node.js platform in no time.


## Prerequisites
Make sure you have installed all of the following prerequisites on your development machine:
* Git - [Download & Install Git](https://git-scm.com/downloads). OSX and Linux machines typically have this already installed.
* Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager. If you encounter any problems, you can also use this [GitHub Gist](https://gist.github.com/isaacs/579814) to install Node.js.
* MongoDB - [Download & Install MongoDB](http://www.mongodb.org/downloads), and make sure it's running on the default port (27017).
* Bower - You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages. Make sure you've installed Node.js and npm first, then install bower globally using npm:

## Environment Variables
- Create a file named ```.env``` in the root directory of this app. You can refer ```.env.example``` file for syntax of .env file.
- Make sure you have set following environment variable in .env file of root directory

```SESSION_SECRET
MAILER_SERVICE_PROVIDER
MAILER_EMAIL_ID
MAILER_PASSWORD
MAILER_FROM
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_REGION
```


## Steps to setup
```bash
$ npm install -g bower grunt gulp
$ npm install
```

## Starting application

Run your application using npm:

```bash
$ npm start
```

Application should run on port 4000 with the *development* environment configuration, so in your browser just go to [http://localhost:4000](http://localhost:4000)


### Running in Production mode
To run your application with *production* environment configuration, execute grunt as follows:

```bash
$ npm run start:prod
```
By default application should run on port 8080 with the *production* environment configuration, so in your browser just go to [http://localhost:8000](http://localhost:8000)

## Running your application with Gulp

The MEAN.JS project integrates Gulp as build tools and task automation.

We have wrapped Gulp tasks with npm scripts so that regardless of the build tool running the project is transparent to you.


```bash
$ gulp
```

To run your application with *production* environment configuration, execute gulp as follows:

```bash
$ gulp prod
```


It is also possible to run any Gulp tasks using npm's run command and therefore use locally installed version of gulp, for example: `npm run gulp eslint`


## License
[The MIT License](LICENSE.md)
