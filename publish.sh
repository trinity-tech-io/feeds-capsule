#!/bin/sh


function publish(){
  echo 'Publish news is ' "$news"
  trinity-cli publish --did did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg#primary --news "$news"
  echo 'publish success'
}


function appendCommitId(){
  dest="./src/app/pages/about/about.ts"

  COMMITID=$(git log --format=%h -1)
  echo 'CommitID is '$COMMITID
  sed -i "" "s/version = \"v[0-9.]*/&(${COMMITID})/" $dest
  echo 'Append commit success'
  publish
}

if [[ -n $(git diff --stat)  ]]
then
  echo 'Work space dirty'
else
  read -p "Enter publish news: " news
  appendCommitId
fi
