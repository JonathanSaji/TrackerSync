

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function normalizeSubscriptionRow(row) {
  return {
    ...row,
    id: Number(row.id),
    amount: Number(row.amount ?? 0),
    amountPerCycle: Number(row.amountPerCycle ?? 0),
    personalValue: row.personalValue === null || row.personalValue === undefined || row.personalValue === ''
      ? null
      : Number(row.personalValue)
  };
}

// Calculate next renewal date based on start date & billing cycle
function getNextRenewalDate(startDateStr, billingCycle) {
  const [year, month, day] = startDateStr.split('-').map(Number);
  let nextDate = new Date(year, month - 1, day); // local midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (nextDate < today) {
    switch (billingCycle.toLowerCase()) {
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      default: nextDate = new Date(today.getTime() + 1000*60*60*24);
    }
  }
  return nextDate;
}

// Main email sending function
async function sendEmailReminders(pool) {
  let subscriptions = [];
  
  // Fetch subscriptions from database if pool is provided
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM subscriptions WHERE user_id IS NOT NULL');
      subscriptions = result.rows.map(normalizeSubscriptionRow);
      console.log(`Email reminders loaded ${subscriptions.length} subscriptions from DB`);
    } catch (err) {
      console.error('Failed to fetch subscriptions from database:', err.message);
      return;
    }
  } else {
    // Fallback if pool not provided (backward compatibility)
    console.error('sendEmailReminders called without pool parameter');
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: { user: 'zayaanhamid.zh@yahoo.com', pass: 'tztj iemj hyai rfhq' }
  });

  for (const sub of subscriptions) {
    if (!sub.id || !sub.user_id || !sub.date) continue;

    // Get the user's email from the accounts table
    let userEmail;
    try {
      const accountResult = await pool.query(
        'SELECT email FROM accounts WHERE id = $1',
        [sub.user_id]
      );
      if (accountResult.rowCount === 0) {
        console.log(`Skipping subscription ${sub.id}: account not found for user_id ${sub.user_id}`);
        continue;
      }
      userEmail = accountResult.rows[0].email;
    } catch (err) {
      console.error(`Failed to fetch account for subscription ${sub.id}:`, err.message);
      continue;
    }

    const nextRenewal = getNextRenewalDate(sub.date, sub.billingCycle);
    const dayDiff = Math.ceil((nextRenewal - today) / (1000*60*60*24));

    if (dayDiff === 1) {
      // Check if reminder was already sent for this billing date
      if (sub.last_reminder_sent_date === sub.date) {
        console.log(`Reminder already sent for subscription ${sub.id} (${sub.name}) on date ${sub.date}`);
        continue;
      }

      try {
        const info = await transporter.sendMail({
          from: '"SubSync" <zayaanhamid.zh@yahoo.com>',
          to: userEmail,
          subject: `Subsync Reminder: ${sub.name} renews tomorrow.`,
          text: `Hi! Your subscription "${sub.name}" will renew tomorrow. 
Amount: $${sub.amountPerCycle.toFixed(2)} (${sub.billingCycle ?? "Monthly"}). 
Next billing date: ${sub.date}. 
Status: ${sub.isTrial ? "Trial ends soon" : "Paid subscription"}.

Make sure your payment method is up to date!`
        });
        console.log(`Reminder sent to ${userEmail} for ${sub.name}: ${info.messageId}`);

        // Update the subscription to mark reminder as sent for this date
        await pool.query(
          'UPDATE subscriptions SET last_reminder_sent_date = $1 WHERE id = $2',
          [sub.date, sub.id]
        );
        console.log(`Updated subscription ${sub.id} last_reminder_sent_date to ${sub.date}`);
      } catch (err) {
        console.error(`Failed to send reminder for subscription ${sub.id}:`, err.message);
      }
    }
  }
}

module.exports = { sendEmailReminders };

if (require.main === module) {
  sendEmailReminders().catch(err => console.error(err));
}


