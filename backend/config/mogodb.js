// create a configaration file to connect to mongodb using mongoose and dotenv
require('dotenv').config();
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || process.env.MONO_URI;
if (!mongoUri) {
  console.error('MONGO_URI is not set in environment');
  process.exit(1);
}
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Mongo connection error:', err);
    process.exit(1);
});

module.exports = mongoose;