import * as tf from '@tensorflow/tfjs-node';
import { CrowdReport } from './index.js';

let model = null;
let isTraining = false;

// 1. Define Model Architecture
const createModel = () => {
    const model = tf.sequential();

    // Input: [Hour(0-23), Day(0-6), Month(0-11), IsHoliday(0/1), WeatherScore(0-100)]
    model.add(tf.layers.dense({
        inputShape: [5],
        units: 16,
        activation: 'relu'
    }));

    model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
    }));

    // Output: Crowd Percentage (0-100)
    model.add(tf.layers.dense({
        units: 1,
        activation: 'linear' // linear for regression
    }));

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError'
    });

    return model;
};

// 2. Prepare Data (Normalize inputs)
const normalizeInput = (hour, day, month, isHoliday, weatherScore) => {
    return tf.tensor2d([
        [
            hour / 23,           // Normalize 0-1
            day / 6,             // Normalize 0-1
            month / 11,          // Normalize 0-1
            isHoliday ? 1 : 0,   // Binary
            weatherScore / 100   // Normalize 0-1
        ]
    ]);
};

// 3. Train Model
export const trainModel = async () => {
    if (isTraining) return;
    isTraining = true;
    console.log('Starting ML Model Training...');

    try {
        // Fetch data from DB
        const reports = await CrowdReport.find().limit(1000); // Limit for performance

        if (reports.length < 10) {
            console.log('Insufficient data for ML training. Skipping.');
            isTraining = false;
            return;
        }

        const inputs = [];
        const labels = [];

        reports.forEach(r => {
            // Mock feature extraction (In real app, join with weather/holiday data)
            const date = new Date(r.timestamp);
            const hour = r.hour || date.getHours();
            const day = r.dayOfWeek || date.getDay();
            const month = date.getMonth();
            const isHoliday = 0; // Placeholder: Need holiday service
            const weatherScore = 80; // Placeholder: Need historical weather

            inputs.push([hour / 23, day / 6, month / 11, isHoliday, weatherScore / 100]);
            labels.push([r.crowdLevel === 'high' ? 90 : r.crowdLevel === 'medium' ? 60 : 30]);
            // Note: database stores 'low'/'medium'/'high', mapping to approx %
        });

        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(labels);

        if (!model) model = createModel();

        await model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32,
            shuffle: true
        });

        console.log('ML Model Training Complete');

        // Cleanup tensors
        xs.dispose();
        ys.dispose();

    } catch (error) {
        console.error('ML Training Error:', error);
    } finally {
        isTraining = false;
    }
};

// 4. Predict
export const predictCrowd = async (hour, day, month, isHoliday, weatherScore) => {
    if (!model) {
        // console.log('ML Model not ready, using heuristic fallback');
        return null; // Signal to use fallback
    }

    try {
        const inputTensor = normalizeInput(hour, day, month, isHoliday, weatherScore);
        const prediction = model.predict(inputTensor);
        const value = (await prediction.data())[0];

        inputTensor.dispose();
        prediction.dispose();

        // Clamp between 0-100
        return Math.max(0, Math.min(100, Math.round(value)));
    } catch (error) {
        console.error('Prediction Error:', error);
        return null;
    }
};
