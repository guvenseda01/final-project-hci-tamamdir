const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const categoryRoutes = require('./routes/categories');

const { errorHandler } = require('./middleware/errorHandler');
const swaggerSpecs = require('./config/swagger');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Tamamdır API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
