const AWS = require('aws-sdk');
const Twitter = require('twitter');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();
const kms = new AWS.KMS({ region: 'eu-west-1' });

const screenName = 'BBC_News_Labs';
const s3bucket = 'twitter-stats';
const s3key = 'stats.json';

const getTwitterClient = () => {
  const credentialsFile = fs.readFileSync(path.join(__dirname, 'credentials.json-encrypted'));

  return kms.decrypt({ CiphertextBlob: credentialsFile }).promise()
    .then((data) => {
      const credentials = JSON.parse(data.Plaintext.toString());
      const twitterClient = new Twitter(credentials);
      return twitterClient;
    });
};

const twitterRequest = (client, method, params) => (
  new Promise((resolve, reject) => {
    client.get(method, params, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  })
);

const getFollowers = client => (
  twitterRequest(client, 'users/show', { screen_name: screenName })
    .then(result => result.followers_count)
);

const getTweets = (client, sinceId) => (
  twitterRequest(client, 'statuses/user_timeline', { screen_name: screenName, count: 200, since_id: sinceId })
    .then(tweets => tweets
      .map(t => ({
        id: t.id_str,
        date: new Date(t.created_at),
        retweet: t.retweeted_status !== undefined,
        reply: t.in_reply_to_screen_name !== null && t.in_reply_to_screen_name !== screenName,
        text: t.text,
      }))
      .sort((t1, t2) => t1.date - t2.date)
    )
);

const getPreviousStats = () => (
  s3.getObject({ Bucket: s3bucket, Key: s3key }).promise()
    .then(data => JSON.parse(data.Body.toString('utf-8')))
    .catch((e) => {
      if (e.name === 'NoSuchKey') {
        return {
          followers: [],
          tweets: [],
        };
      }
      throw e;
    })
);

const getNewStats = previousStats => (
  getTwitterClient()
    .then(client => Promise.all([
      getFollowers(client),
      Promise.resolve(
          previousStats.tweets
            && previousStats.tweets.length > 0
            && previousStats.tweets[previousStats.length - 1]
        )
        .then(sinceId => getTweets(client, sinceId || undefined))
        .then(tweets => tweets.filter(t =>
          previousStats.followers[0] && t.date > new Date(previousStats.followers[0].date)
        )),
    ]))
    .then(results => ({
      followers: previousStats.followers.concat([{
        date: new Date(),
        count: results[0],
      }]),
      tweets: previousStats.tweets.concat(results[1]),
    }))
);

const uploadStats = stats => (
  s3.upload({
    Bucket: s3bucket,
    Key: s3key,
    Body: JSON.stringify(stats),
    ContentDisposition: 'inline',
    ContentType: 'application/json',
  }).promise()
);

exports.handler = (event, context, callback) => {
  getPreviousStats()
    .then(previousStats => getNewStats(previousStats))
    .then(stats => uploadStats(stats))
    .then(() => callback(null, 'Success!'))
    .catch(error => callback(error));
};
