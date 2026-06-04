require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const leadRoutes = require('./routes/leads');
const opportunityRoutes = require('./routes/opportunities');
const activityRoutes = require('./routes/activities');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// Serve the CRM dashboard SPA
const dashboardDir = path.join(__dirname, '..', 'frontend', 'dashboard');
app.use(express.static(dashboardDir));
app.get('*', (req, res) => res.sendFile(path.join(dashboardDir, 'index.html')));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();

  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Empty database — running seed script...');
    try {
      const { execSync } = require('child_process');
      execSync('node backend/seed/seed.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: process.env,
      });
    } catch (e) {
      console.warn('Seed script error:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`CRM server running on http://localhost:${PORT}`);
  });
};

start();
