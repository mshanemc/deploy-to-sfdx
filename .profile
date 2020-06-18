echo ".Profile: Updating PATH"
export PATH=$PATH:/app

echo ".Profile: Updating PATH to include Salesforce CLI ..."
export PATH=$PATH:/app/.local/share/sfdx/cli/bin/

export SFDX_LAZY_LOAD_MODULES=false
# do not autoupdate
export SFDX_AUTOUPDATE_DISABLE=true
# new json settings
export SFDX_JSON_TO_STDOUT=true

# heroku credentials for Heroku Connect API
export HEROKU_USERNAME=$HEROKU_USERNAME
export HEROKU_PASSWORD=$HEROKU_PASSWORD

echo ".Profile: Creating local resources ..."
mkdir /app/dist/tmp
mkdir /app/tmp

echo ".Profile: Completed!"