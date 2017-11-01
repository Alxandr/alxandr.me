#!/bin/bash

aws s3 sync public s3://alxandr.me --region=eu-central-1 --acl public-read --sse --delete
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id E2YEWEAEVXB2NN --paths '/*'
