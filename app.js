require('dotenv').config();
const express = require('express');
const config = require('config');
const mongoose = require('mongoose').set('debug', config.get('mongooseDebug'));
const cloudinary = require('cloudinary').v2;
const path = require('path');
const cookieParser = require('cookie-parser');
const { handleError } = require('./usecases/error');
const emailTransporter = require('./usecases/emailTransporter');
const renderConfirmationEmail = require('./usecases/renderConfirmationEmail');

const PORT = config.get('port');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/contests', require('./routes/contest.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/games', require('./routes/game.routes'));

app.disable('etag');

if (process.env.NODE_ENV === 'production') {
  app.use('/', express.static(path.join(__dirname, 'client', 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
}

app.use((err, req, res, next) => handleError(err, res));

(async () => {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    cloudinary.config({
      cloud_name: config.get('cloudinary.cloudName'),
      api_key: config.get('cloudinary.apiKey'),
      api_secret: config.get('cloudinary.apiSecret'),
    });
    app.listen(PORT, () => console.log(`Listening localhost:${PORT}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
