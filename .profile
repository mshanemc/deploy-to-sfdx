echo ".Profile: Updating PATH"
export PATH=$PATH:/app

echo ".Profile: Updating PATH to include Salesforce CLI ..."
export PATH=$PATH:/app/.local/share/sfdx/cli/bin/

export SFDX_LAZY_LOAD_MODULES=false
# do not autoupdate
export SFDX_AUTOUPDATE_DISABLE=true
# new json settings
export SFDX_JSON_TO_STDOUT=true

echo ".Profile: Creating local resources ..."
mkdir /app/dist/tmp
mkdir /app/tmp

echo ".Profile: Adding support for private repos"
git config --global url."https://api@github.com/".insteadOf "https://github.com/"
git config --global url."https://ssh@github.com/".insteadOf "ssh://git@github.com/"
git config --global url."https://git@github.com/".insteadOf "git@github.com:"

echo 'echo $GITHUB_PAT' > $HOME/.git-askpass
chmod +x $HOME/.git-askpass
export GIT_ASKPASS=$HOME/.git-askpass
export GITHUB_PAT=(echo $GITHUB_PAT)

echo ".Profile: Completed!"