const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');
const coupleRoutes = require('./src/routes/couple.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/couples', coupleRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
