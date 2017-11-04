echo "Updating PATH"
export PATH=$PATH:/app

echo "Updating PATH to include Salesforce CLI ..."
export PATH=$PATH:/app/.local/share/sfdx/cli/bin/

echo "Updating Salesforce CLI plugin ..."
sfdx update

echo "Creating local resources ..."
mkdir /app/tmp

echo "Completed!"