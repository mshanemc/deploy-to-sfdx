echo "Updating PATH"
export PATH=$PATH:/app

echo "Updating PATH to include Salesforce CLI ..."
export PATH=$PATH:/app/.local/share/sfdx/cli/bin/

echo "Creating local resources ..."
mkdir /app/tmp

echo "checking heroku auth"
echo `heroku auth:token`

echo "Completed!"