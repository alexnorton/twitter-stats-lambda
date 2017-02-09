const lambda = require('./index').handler;

const event = {};

const context = {};

const callback = (error, result) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
};

lambda(event, context, callback);
