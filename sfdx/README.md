# CLI for sfdx

This is the latest `sfdx` CLI application, based on Heroku's v6
[cli-engine](https://github.com/heroku/cli-engine).  By default it comes installed with the [salesforcedx](https://www.npmjs.com/package/salesforcedx) plugin, which contributes all commands from the `force` command namespace.

## Installation

You can install this by either using an OS-specific installer [available here](https://developer.salesforce.com/tools/sfdxcli), by directly installing it with `npm` or `yarn` (see the instructions below), or if using macOS or linux by running the `install` script in a standalone installer (links to which can be found in the latest tarball [manifest](https://developer.salesforce.com/media/salesforce-cli/manifest.json)).

### Requirements

To get started, you'll need to install `node` v8.4 or greater, though we recommend using v8.6 or later for the best experience.  While this can be done using an installer from [nodejs.com](nodejs.com) or via an OS-specific package manager, we recommend using [nvm](https://github.com/creationix/nvm) to easily manage multiple `node` versions.

If using `nvm`, be sure that you've selected the v8.4+ version with `nvm use v8.x.y`, where `x` and `y` are specific to the version that you installed. If you want to use this version by default run `nvm alias default node` -- otherwise, when you restart your shell `nvm` will revert to whatever version configured prior to installing v8.x.y.

### Installing with `npm`

`npm` is installed automatically with Node.js.  Install the CLI using `npm` as follows:

```bash
> npm install --global sfdx-cli
```

### Installing with `yarn`

`yarn` is another popular Node.js package manager that can be used to install the CLI, but it needs to be [installed separately](https://yarnpkg.com/en/docs/install) from Node.js if you choose to use it.

Note that by default `yarn` will attempt to install the binary in a location that may conflict with the location used by the installers, so you may additionally want to run the following command to avoid collision should you want to maintain two separate installations: `yarn config set prefix ~/.yarn` (macOS and Linux).  Then, use the following:

```bash
> yarn global add sfdx-cli
```

## Development

If you are a Salesforce T&P employee, please see also the internal [developer documentation](./DEVELOPER.md).
