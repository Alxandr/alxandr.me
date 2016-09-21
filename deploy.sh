#!/bin/bash
# set -o xtrace # Print commands
set -e # Exit with nonzero exit code if anything fails

SOURCE_BRANCH="master"
TARGET_BRANCH="gh-pages"
TARGET_DIR="public"
OUT_DIR="out"

function doCompile {
  webpack --minimize
  JEKYLL_ENV=production bundle exec jekyll build
}

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping deploy; just doing a build."
    doCompile
    exit 0
fi

# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}
SHA=`git rev-parse --verify HEAD`

# Clone the existing gh-pages for this repo into out/
# Create a new empty branch if gh-pages doesn't exist yet (should only happen on first deply)
git clone $REPO $OUT_DIR
pushd $OUT_DIR
git checkout $TARGET_BRANCH || git checkout --orphan $TARGET_BRANCH && git reset --hard && git clean -dfx
popd

# Clean out existing contents
rm -rf "./$OUT_DIR/*" || exit 0
ls -la "$OUT_DIR"

# Run our compile script
doCompile

# Now let's go have some fun with the cloned repo
ls -la $TARGET_DIR
cp -r "./$TARGET_DIR/." $OUT_DIR
pushd $OUT_DIR
pwd
ls -la
git config user.name "Travis CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"
touch .nojekyll

# Commit the "changes", i.e. the new version.
# The delta will show diffs between new and old versions.
git add . --all
git commit -m "Deploy to GitHub Pages: ${SHA}"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in ../deploy_key.enc -out deploy_key -d
chmod 600 deploy_key
eval `ssh-agent -s`
ssh-add deploy_key

# Now that we're all set up, we can push.
git push $SSH_REPO $TARGET_BRANCH
