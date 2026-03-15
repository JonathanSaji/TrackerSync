const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const subscriptionsPath = path.join('./data', 'subscriptions.json');
const emailsPath = path.join('./data', 'emails.json');       // array of emails
const emailsSentPath = path.join('./data', 'emailsSent.json'); // array of sub IDs already sent

// Helper: read JSON file
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Helper: write JSON file
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Calculate next renewal date based on start date & billing cycle
function getNextRenewalDate(startDateStr, billingCycle) {
  const startDate = new Date(startDateStr);
  const today = new Date();
  let nextDate = new Date(startDate);

  while (nextDate < today) {
    switch (billingCycle.toLowerCase()) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate = new Date(today.getTime() + 1000*60*60*24); // fallback: tomorrow
    }
  }
  return nextDate;
}

// Main email sending function
async function sendEmailReminders() {
  const subscriptions = readJSON(subscriptionsPath);
  const emails = readJSON(emailsPath);        // ["user@email.com", ...]
  const emailsSent = readJSON(emailsSentPath); // [1773568137573, ...]

  const today = new Date();
  today.setHours(0,0,0,0); // ignore time for comparison

  let updated = false;

  // create transporter once
  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: { user: 'zayaanhamid.zh@yahoo.com', pass: 'tztj iemj hyai rfhq' }
  });

  for (const sub of subscriptions) {
    if (!sub.id) continue; // skip if no id

    const nextRenewal = getNextRenewalDate(sub.date, sub.billingCycle);
    const dayDiff = Math.ceil((nextRenewal - today) / (1000*60*60*24));

    if (dayDiff === 1 && !emailsSent.includes(sub.id)) {
      for (const email of emails) {
        const info = await transporter.sendMail({
          from: '"SubSync" <zayaanhamid.zh@yahoo.com>',
          to: email,
          subject: `Subsync Reminder: ${sub.name} renews tomorrow.`,
          text: `Hi! Your subscription "${sub.name}" will renew tomorrow. 
              Amount: $${sub.amountPerCycle.toFixed(2)} (${sub.billingCycle ?? "Monthly"}). 
              Next billing date: ${sub.date}. 
              Status: ${sub.isTrial ? "Trial ends soon" : "Paid subscription"}.

            Make sure your payment method is up to date!`
        });
        console.log(`Reminder sent to ${email} for ${sub.name}: ${info.messageId}`);
      }

      // mark as sent
      emailsSent.push(sub.id);
      updated = true;
    }
  }

  if (updated) writeJSON(emailsSentPath, emailsSent);
}

// CommonJS export
module.exports = { sendEmailReminders };

// run immediately if called directly
if (require.main === module) {
  sendEmailReminders().catch(err => console.error(err));
}

