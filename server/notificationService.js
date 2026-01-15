import cron from 'node-cron';
import mongoose from 'mongoose';
import { Temple, User, Notification, calculateCrowdPrediction, festivals } from './index.js';

// Run every hour at minute 0
export const startNotificationScheduler = () => {
    console.log('Starting notification scheduler...');

    // Schedule task to run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running hourly notification check...');
        try {
            await checkAndGenerateNotifications();
        } catch (error) {
            console.error('Error in notification scheduler:', error);
        }
    });
};

const checkAndGenerateNotifications = async () => {
    try {
        // 1. Get all users who have favorites
        const users = await User.find({
            favorites: { $exists: true, $not: { $size: 0 } }
        }).populate('favorites');

        console.log(`Checking notifications for ${users.length} users...`);

        const currentHour = new Date().getHours();
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const dayOfWeek = today.getDay();

        for (const user of users) {
            for (const temple of user.favorites) {
                // Calculate current crowd prediction
                const prediction = await calculateCrowdPrediction(temple, currentHour, dayOfWeek, dateStr);

                // Logic: If crowd is LOW (< 40%) and it's daytime (6 AM - 8 PM)
                if (prediction.crowdLevel === 'low' && currentHour >= 6 && currentHour <= 20) {

                    await createUniqueNotification(
                        user._id,
                        `Low Crowd at ${temple.name}!`,
                        `Current crowd level is only ${prediction.crowdPercentage}%. Great time to visit!`,
                        'alert'
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error generating notifications:', error);
    }
};

// Helper to prevent duplicate notifications on the same day
const createUniqueNotification = async (userId, title, message, type) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Check if we already sent a similar notification today
    const existing = await Notification.findOne({
        user: userId,
        title: title,
        createdAt: { $gte: startOfDay }
    });

    if (!existing) {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            read: false
        });
        console.log(`Notification created for user ${userId}: ${title}`);
    }
};
