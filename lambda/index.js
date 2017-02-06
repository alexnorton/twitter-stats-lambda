const AWS = require('aws-sdk');
const Twitter = require('twitter');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();
const kms = new AWS.KMS({ region: 'eu-west-1' });

const screenName = 'BBC_News_Labs';
const s3bucket = 'twitter-stats';
const s3key = 'stats.json';

exports.handler = (event, context, callback) => {
  const credentialsFile = fs.readFileSync(path.join(__dirname, 'credentials.json-encrypted'));

  kms.decrypt({ CiphertextBlob: credentialsFile }, (credentialsError, data) => {
    if (credentialsError) {
      callback(credentialsError);
    }

    const credentials = JSON.parse(data.Plaintext.toString());

    const twitterClient = new Twitter(credentials);

    s3.getObject({ Bucket: s3bucket, Key: s3key }, (downloadError, statsData) => {
      if (downloadError) {
        callback(downloadError);
      }
      const statsFile = JSON.parse(statsData.Body.toString('utf-8'));

      twitterClient.get('users/show', { screen_name: screenName }, (twitterError, tweets) => {
        if (twitterError) {
          callback(twitterError);
        }
        statsFile.stats.push([(new Date()).toISOString(), tweets.followers_count]);

        s3.upload(
          {
            Bucket: s3bucket,
            Key: s3key,
            Body: JSON.stringify(statsFile),
            ContentDisposition: 'inline',
            ContentType: 'application/json',
          },
          (uploadError) => {
            if (uploadError) {
              callback(uploadError);
            }
            callback(null, `Success!\nFollower count: ${tweets.followers_count}\nNumber of records: ${statsFile.stats.length}`);
          });
      });
    });
  });
};
