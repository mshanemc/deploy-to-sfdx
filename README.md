# SFDX Deployer

[![npm version](https://badge.fury.io/js/shane-sfdx-plugins.svg)](https://badge.fury.io/js/shane-sfdx-plugins)

Front end: [LWC](lwc.dev)

Back end: nodejs/express/typescript + heroku buildpacks

Test: jest

[Video explanation](https://youtu.be/gyGt386eAqw?t=1168) from May 2019 (TDX) (some things have changed, especially LWC instead of vue)

## Purpose

You have a dev hub, and an sfdx repo. You'd like to let people spin up scratch orgs based on the repo, and these people might not feel like using a terminal, cloning the repo, loggin in to a dev hub, and executing sfdx commands.

-   because they might not be developers (think admins, or even end users in a training scenario)
-   because they might not be Salesforce developers (say you built an app and give your designer/CSS person github access to "make it cool")
-   because you might have dev hub access and you don't want to give it to them
-   because you want to let people test the app quickly
-   because (like me) you're using it for workshops and demos

---

## Connected app setup

Create a connected app for JWT auth, with certificates, per the SFDX setup guide.

<https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_jwt_flow.htm>

---

## Environment variables

you can find a list of all the env vars in <https://github.com/mshanemc/deploy-to-sfdx/blob/master/src/server/lib/processWrapper.ts>

### Required

-   `HUB_USERNAME` the username from your dev hub
-   `CONSUMERKEY` from your connected app
-   `REDIS_URL` starts with `redis://` (probably set up automatically when you use the heroku button)

### Plus one of the following, depending on where you're running

-   `JWTKEY` use only in heroku cloud. Cut/paste your server.key, including the ---- lines
-   `LOCAL_ONLY_KEY_PATH` don't use this in the cloud. Put it in your local .env file, and it needs to be an absolute path

### strongly recommended

-   `HEROKU_API_KEY` can run one-off dynos, needed for org pools (see below) and lets you combine the deployer with my sfdx plugin to deploy heroku apps to a team. If you're note using org pools, be sure to delete these heroku apps. See [the plugin docs](https://github.com/mshanemc/shane-sfdx-plugins#sfdx-shaneherokurepodeploy) for how to use this

### optional

-   `UA_ID` for google analytics measurement protocol
-   `GITHUB_USERNAME_WHITELIST` lets you whitelist usernames. It's a comma-separated list. Ex: `mshanemc,andrew,bebraw`
-   `GITHUB_REPO_WHITELIST` lets you whitelist username/repo combinations. It's a comma-separated list. Ex: `mshanemc/DF17integrationWorkshops,torvalds/linux`
-   if you need to use the prerelease version of the sfdx plugin, then set `SFDX_PRERELEASE` to true.
-   org pools -- see below for details
-   BYOO (bring your own org) -- see below for details

What's whitelisting do? Normally, this app will parse your orgInit.sh and throw an error if you're doing any funny business. BUT if you're on the whitelist, the app owner trusts you and you can do things with bash metacharacters (think &&, |, >) and execute non-sfdx commands (grep, rm, whatever!) etc. BE CAREFUL!

Here's a heroku button so you can have your own instance of the Deployer

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https%3A%2F%2Fgithub.com%2Fmshanemc%2Fdeploy-to-sfdx)

---

## Heroku setup

The button will start this on free hobby dynos. For real life, I'd recommend a pair of web 1x and a pair of workers (orgbuilder) at 1x.

If you're going to be doing a lot of users (imagine a workshop where lots of people are pushing the button at the same time) you can scale out more workers so the people last in line don't have to wait so long. Otherwise, it'll spin while the workers are busy processing the deploy request queue.

The oneoffbuilder is the same as the orgbuilder but exits when it's finished with its queue item. They do take ~30 seconds to spin up before starting to build an org, so having "live workers" is better. These give you the ability to scale out work horizontally (booting up a new dyno will be faster than waiting in line behind several other deploys on the always-live workers)

Up to you to balance costs between live workers (orgbuilder) and on-demand (oneoffbuilder).

Add Heroku Scheduler to your app and set `orgdeleter` to run every 10 minutes or so. Deleted orgs go into a deletion queue that isn't actively monitored so this will free up some scratch org capacity for you.
Then have `dynoskimmer` run every 10 minutes or so...it kills one-off dyno processes that stalled out
If you're using org pools, you also want to have scheduler running `poolwatcher` (checks actual pools vs. configuration and starts `poolbuilder` processes) and `poolskimmer` (deletes expired orgs from the pools) scheduled.

---

## Architectural overview

Nodejs, express run the web server.
When the web server receives a request, it creates a unique deployID (user-repo-timestamp plus a few random digits) and a message on the deploy queue (using Heroku Redis)
The server redirects the user to a web page which polls an http endpoint (/results/:deployId) for updated results

When a process starts up, it auths to a devhub via its environment variables.
Then it listens to the deploy queue and executes jobs

-   clone the repo into local filestorage
-   execute the orgInit.sh script, or the default create/push/open flow if there isn't one
-   drop the output results into a redis key (the deployId) so that the results endpoint can find it
-   delete the local folder and send the ALLDONE message

It runs a plugin that give it powers SFDX doesn't out-of-the-box
<https://github.com/mshanemc/shane-sfdx-plugins> along with `sfdx-migration-automatic` and `@salesforce/analytics`

Put plugins in the package.json dependencies, then linked from source in lib/hubAuth.js. Feel free to add additional plugins using npm install some-plugin-of-yours and then add it in hubAuth.js.

---

## BYOO Bring your own org (optional, mildly dangerous)

Let people deploy from a repo to an existing org, and run some scripts. Set the BYOO environment variables to match a connected app (it needs to be a separate connected app from the one your hub uses because that one uses cert/jwt to auth, and this one won't have a cert). You'll need to set the appropriate callback URIs for the /token page.

Users sign into their app, and then the deployer connects that instead of using a new scratch org. Password commands are omitted from the scripts, since that would be cruel.

Change the launcher url from `.../launch?template=...` to `.../byoo?template=...` to use the BYOO feature.

The page warns people about the risks of executing scripts in a non-scratch org. Expect failures because you don't know what features are available.

---

## Org pools (optional, advanced!)

Building orgs that take too long? Ever have one that doesn't get its DNS ready in time? Know you're mostly deploying the same orgs all the time?

Org Pools are the answer. You tell it which username/repo pairs, and how many orgs you'd like pre-built. When the user requests one, you simply grab one from the pool. Orgs in the pool are less than 12 hours old so they stay fresh.

There's 3 worker dynos, both off by default (leave them that way).

-   If you want pools, use Heroku Scheduler to run the `poolwatcher` task up to every 10 minutes (as a one-off dyno). If any pool orgs need to be created, it'll start up one-off dynos to handle that
-   run poolskimmer with Heroku Scheduler every hour or so--it'll check for expired orgs to help keep you within your limits.

Then, in your .env/heroku config vars, point the deployer to some url that returns json.
`POOLCONFIG_URL` = `https://where.yourstuff/is`.

Finally, since poolwatcher is starting dynos to handle this pool stuff, you want to enable a heroku Labs setting for getting dyno metadata `heroku labs:enable runtime-dyno-metadata -a`. This lets heroku start more heroku with the name of your app being dynamically fed into the environment variables without you having to 1) set that up 2) maintain different names for each instance/stage

Example code here, but feel free to generate it however you like.
<https://github.com/mshanemc/poolsConfig>

```json
[
    {
        "user": "mshanemc", //ex: lives at https://github.com/mshanemc/cg1
        "repo": "cg1",
        "quantity": 4, //how many of this org to keep handy
        "lifeHours": 12 //how long it should live, in hours
    }
    // ... use 1 for each repo
]
```

`pooldeployer` should have 0 dynos running. It runs as a one-off dyno called by **poolwatcher**

---

## Local Setup and Build (Mac...others, who knows?)

in your `.env` add

-   `LOCAL_ONLY_KEY_PATH=/Users/shane.mclaughlin/code/certificates/server.key` or your equivalent to where your cert for jwt is
-   in your `process.env` file, put the Heroku Redis url (it can be the same as you're using in the cloud. **Don't commit this file to your repo.**
-   `npm install` will get all your modules installed, including my plugin.
-   `npm run build` will get the typescript and LWC output from /src to /built, which is where the executables go.
-   then start this app with `npm run local:web` and use localhost:8443

## Building for Local Dev

Backend:
`npx nodemon` will recompile all your typescript and restart the local web and worker servers.

Frontend (LWC):
`npm run client:watch` will start a server on localhost:3001. It'll rebuild and hotswap anytime you save a file.

Running both is good if you're working both front and backend

---

## Debugging on [non-local] Heroku

if **hosted-scratch-qa** is the name of your app

`heroku logs --tail -a hosted-scratch` will give you the logs.

`heroku redis:cli -a hosted-scratch -c hosted-scratch` will lets you look at your redis stuff and see what's in the queue

`heroku ps:exec -a hosted-scratch-qa --dyno=worker.1` lets you ssh into the dyno of your choice and take a look around, clean stuff up, etc.

---

## Setting up a repo (optional)

So you need a target repo to deploy (see examples below). If your repo is simple, the tool will do the default behavior (create, push source, open).

But with an orgInit.sh file, you can list out all your sfdx commands and they'll be executed by the deployer. Remember, no bash metacharacters and only sfdx commands are allowed (We can't let anyone run any arbitrary command on our servers...security, yo!)

That lets you create records, assign permsets, create users, install packages, run tests, generate passwords, and do anything you can do with an SFDX command

## Private repos

By default, the deployer expects all repos to be public. If you really need private repos, you can use the following buildpack and a [Github Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).

<https://github.com/mshanemc/github-via-pat>

## Whatever the personal access token user has access to see, the deployer can then see.

## Testing

uses Jest.

There's a file called `testRepos` that you'll want to customize with any repos you want to use for verification. It'll probably fail if you use mine.

Run them with `npm run test:unit`. A few of them are not true unit tests...the require a server and redis running, and will try to connect to github for your testRepos. Run each of these commands in a separate terminal.

```shell
npm run local:web
```

Integration (tests/integrationTests) are slower/harder.

`npm run test:generate` will parse testRepos.ts and create a integration tests for each repo that

1. tests that it deploys
2. builds a pooled org using org pools if you specify testPool=true in testrepos
3. tests that it deploys from the pool

Modify `repoCodeGen.ts` to change the generator.

NOTE: This is using up your scratch org quotas. The tests delete the orgs, so it's minimally wastefully, but still expect it to take a while AND watch your daily limit. Especially if you're testing deploys and tests are failing...you might be using orgs that never get to the delete phase.

---

## Contributing

I'm using typescript...

-   `npm install` will get all your modules installed, including my plugins.
-   `npm build` will get any typescript changes from /src to /built, which is where the executables go.

Finally, the front end app is Lightning Web Components. You'll figure it out...if not, start here: [https://lwc.dev/](https://lwc.dev/)

---

## Launcher URLs

There's not anything at / on the server. Don't worry. The only page you probably care about is `/launch` which takes 1 parameter `template`

So your path should be `https://whatever.herokuapp.com/launch?template=https://github.com/username/reponame`

Also handles branches on github, like `https://whatever.herokuapp.com/launch?template=https://github.com/username/reponame/tree/somebranch`

You can optionally pass in an `email` parameter so that the emails go to someone who's not the hub owner :)
`https://whatever.herokuapp.com/launch?template=https://github.com/username/reponame&email=shane.mclaughlin@salesforce.com`

You can pass in `&email=required` to force user to a form where they add their email. This is useful if they need to deal with emails from the org, or password resets, or security challenges, etc.

---

## Example Repos with orgInit.sh scripts

[![Deploy](https://raw.githubusercontent.com/mshanemc/deploy-to-sfdx/master/client-src/resources/images/sfdx_it_now.png)](https://hosted-scratch.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops) <https://github.com/mshanemc/DF17integrationWorkshops>

---

[![Deploy](https://raw.githubusercontent.com/mshanemc/deploy-to-sfdx/master/client-src/resources/images/sfdx_it_now.png)](https://hosted-scratch.herokuapp.com/launch?template=https://github.com/mshanemc/community-apps-workshop-df17)
<https://github.com/mshanemc/community-apps-workshop-df17>

---

[![Deploy](https://raw.githubusercontent.com/mshanemc/deploy-to-sfdx/master/client-src/resources/images/sfdx_it_now.png)](https://hosted-scratch.herokuapp.com/launch?template=https://github.com/mshanemc/process-automation-workshop-df17)
<https://github.com/mshanemc/process-automation-workshop-df17>

---

[![Deploy](https://raw.githubusercontent.com/mshanemc/deploy-to-sfdx/master/client-src/resources/images/sfdx_it_now.png)](https://hosted-scratch.herokuapp.com/launch?template=https://github.com/mshanemc/df17AppBuilding)<https://github.com/mshanemc/df17AppBuilding>
