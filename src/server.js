import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import botkit from 'botkit';
import path from 'path';
import morgan from 'morgan';
import dotenv from 'dotenv';
import translate from 'google-translate-api';
import getCode from './translate';


dotenv.config({ silent: true });

let language = 'en'; // English

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM((err) => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

const handleMessage = (bot, message, newLangLength) => {
  const messageWords = message.text.split(' ');
  let languageCode = '';
  if (messageWords.length === newLangLength) {
    languageCode = getCode(messageWords[newLangLength - 1]);
  }
  if (languageCode) {
    language = languageCode;
    translate('Okay!', { from: 'en', to: language }).then((res) => {
      bot.reply(message, res.text);
    }).catch((err) => {
      console.error(err);
    });
  } else {
    translate(message.text, { from: 'en', to: language }).then((res) => {
      bot.reply(message, res.text);
    }).catch((err) => {
      console.error(err);
    });
  }
};

controller.on('direct_message', (bot, message) => {
  handleMessage(bot, message, 2);
});

// don't yet work
// controller.on('direct_mention', (bot, message) => {
//   handleMessage(bot, message, 3);
// });
//
// controller.on('ambient', (bot, message) => {
//   if (message.text.split(' ')[0].includes('bot')) handleMessage(bot, message, 3);
// });

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
