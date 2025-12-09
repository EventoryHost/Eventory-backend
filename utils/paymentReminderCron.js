import cron from 'node-cron';
import { runPaymentReminderJob } from './paymentReminderJob.js';

// Runs every day at 10:00 AM IST
cron.schedule(
    '0 10 * * *',
    () => {
        runPaymentReminderJob().catch(err => {
            console.error('Payment reminder job failed:', err);
        });
    },
    { timezone: 'Asia/Kolkata' } // so it runs using India time
);


