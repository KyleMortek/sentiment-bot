# create zip file with node_modules and the stuff inside the dir created by
# typescript
cd dist
zip -r ../dist.zip *
cd ..
zip -r dist.zip node_modules
rm -rf dist

# upload to aws
aws lambda update-function-code --function-name arn:aws:lambda:us-east-1:464772284532:function:slackSentiment --zip-file fileb://./dist.zip

# cleanup
rm dist.zip
