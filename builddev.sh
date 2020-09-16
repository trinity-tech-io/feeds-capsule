#!/bin/sh

function package(){
  rm -rf ./www
  ionic build --prod
  cd www/
  zip -rv dev.epk *
  mv dev.epk ../
  echo "Package finish"
  echo "Output file is ./dev.epk"
}

function appendCommitId(){
  dest="./src/app/pages/about/about.ts"

  COMMITID=$(git log --format=%h -1)
  echo 'CommitID is '$COMMITID
  sed -i "" "s/version = \"v[0-9.]*/&.${COMMITID}/" $dest
  echo 'Append commit success'
  package
}


if [[ -n $(git diff --stat)  ]]
then
  echo 'Work space dirty'
else
  appendCommitId
fi





