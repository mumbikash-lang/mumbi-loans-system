const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Schemas
const applicationSchema = new mongoose.Schema({
    applicantName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const Application = mongoose.model('Application', applicationSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema);

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, 'your_jwt_secret', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Public Routes
app.post('/api/applications', async (req, res) => {
    try {
        const application = new Application(req.body);
        await application.save();
        res.status(201).send(application);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get('/api/loans/calculate', (req, res) => {
    const { amount, interestRate, term } = req.query;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = term * 12;
    
    const monthlyPayment = (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));
    res.json({ monthlyPayment });
});

// Admin Protected Routes
app.use(authenticateJWT);

app.get('/api/admin/applications', async (req, res) => {
    const applications = await Application.find();
    res.send(applications);
});

app.patch('/api/admin/applications/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
    res.send(application);
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loan_management', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => console.log(err));
