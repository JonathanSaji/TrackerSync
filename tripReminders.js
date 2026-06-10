const nodemailer = require('nodemailer');

function toDateOnly(value) {
  if (!value) return null;
  const asString = String(value).slice(0, 10);
  const [year, month, day] = asString.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toIsoDate(value) {
  const d = toDateOnly(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateString) {
  const d = toDateOnly(dateString);
  if (!d) return 'Unknown date';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRowsHtml(subscriptions) {
  if (!subscriptions.length) {
    return '<tr><td style="padding:12px 16px;">No matching subscriptions found.</td></tr>';
  }

  return subscriptions
    .map((sub) => {
      const amountPerCycle = Number(sub.amountPerCycle ?? sub.amount ?? 0);
      const amountText = Number.isFinite(amountPerCycle) ? `$${amountPerCycle.toFixed(2)}` : '$0.00';
      const cycle = escapeHtml(sub.billingCycle || 'Monthly');
      const dateLabel = escapeHtml(formatDateLabel(sub.date));
      const safeName = escapeHtml(sub.name || 'Subscription');
      return `
<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #f3d54e;color:#111827;">${safeName}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #f3d54e;color:#374151;">${amountText}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #f3d54e;color:#374151;">${cycle}</td>
  <td style="padding:12px 16px;border-bottom:1px solid #f3d54e;color:#374151;">${dateLabel}</td>
</tr>`;
    })
    .join('');
}

function buildBaseHtmlTemplate(title, subtitle, introText, sectionsHtml) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Poppins,Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #ffd700;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#000000;padding:22px 28px;border-bottom:3px solid #ffd700;">
                <p style="margin:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#ffd700;">TrackerSync Trip Assistant</p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h1>
                <p style="margin:8px 0 0;font-size:13px;color:#d1d5db;">${escapeHtml(subtitle)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111827;">${escapeHtml(introText)}</p>
                ${sectionsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#fff8dc;border-top:1px solid #ffd700;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">This reminder was sent by TrackerSync.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTripWindowText(trip) {
  return `${formatDateLabel(trip.start_date)} to ${formatDateLabel(trip.end_date)}`;
}

function buildInitialEmail(trip, subscriptions) {
  const tripWindow = buildTripWindowText(trip);
  const rows = buildRowsHtml(subscriptions);
  const text = [
    'Hi,',
    '',
    `Your trip (${tripWindow}) has confirmed subscriptions renewing during your trip window.`,
    '',
    ...(subscriptions.length
      ? subscriptions.map((s) => `- ${s.name} | ${s.date} | ${s.billingCycle ?? 'Monthly'}`)
      : ['No matching subscriptions found.']),
    '',
    'Safe travels,',
    'TrackerSync'
  ].join('\n');

  const html = buildBaseHtmlTemplate(
    'Trip Renewal Digest',
    `Trip window: ${tripWindow}`,
    'We checked your subscription renewals for your confirmed trip. Here is your trip renewal digest.',
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3d54e;border-radius:10px;background:#fffcf0;overflow:hidden;">
      <tr>
        <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Subscription</th>
        <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Amount</th>
        <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Cycle</th>
        <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Renewal Date</th>
      </tr>
      ${rows}
    </table>`
  );

  return {
    subject: `TrackerSync Trip Digest: ${subscriptions.length} renewal(s) during your trip`,
    text,
    html
  };
}

function buildNoSubscriptionsEmail(trip) {
  const tripWindow = buildTripWindowText(trip);
  const text = [
    'Hi,',
    '',
    `We noticed you are going on a trip (${tripWindow}).`,
    'You currently have no subscriptions renewing during your trip dates.',
    'If you add one that renews during the trip, we will email you before renewal.',
    '',
    'Safe travels,',
    'TrackerSync'
  ].join('\n');

  const html = buildBaseHtmlTemplate(
    'No Renewals During Trip',
    `Trip window: ${tripWindow}`,
    'We noticed you are going on a trip, and there are currently no subscriptions renewing during your trip dates.',
    `<div style="border:1px solid #f3d54e;border-radius:10px;background:#fffcf0;padding:16px;">
      <p style="margin:0 0 10px;color:#374151;font-size:14px;">If you add a subscription that renews during your trip, we will automatically email you again.</p>
      <p style="margin:0;color:#374151;font-size:14px;">Safe travels.</p>
    </div>`
  );

  return {
    subject: 'TrackerSync Trip Digest: No subscriptions renewing during your trip',
    text,
    html
  };
}

function buildNewSubscriptionEmail(trip, newSubscriptions, existingSubscriptions) {
  const tripWindow = buildTripWindowText(trip);
  const newRows = buildRowsHtml(newSubscriptions);
  const existingRows = buildRowsHtml(existingSubscriptions);

  const text = [
    'Hi,',
    '',
    `A new subscription you added will renew during your trip (${tripWindow}).`,
    '',
    'Newly detected renewals:',
    ...newSubscriptions.map((s) => `- ${s.name} | ${s.date}`),
    '',
    'Other renewals already flagged for this trip:',
    ...(existingSubscriptions.length ? existingSubscriptions.map((s) => `- ${s.name} | ${s.date}`) : ['- None']),
    '',
    'Please renew as needed before travel.',
    'TrackerSync'
  ].join('\n');

  const html = buildBaseHtmlTemplate(
    'New Trip Renewal Detected',
    `Trip window: ${tripWindow}`,
    'A newly added subscription now renews during your trip. We are resending your full context so you can plan ahead.',
    `
      <h3 style="margin:0 0 8px;font-size:15px;color:#111827;">Newly detected during trip</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3d54e;border-radius:10px;background:#fffcf0;overflow:hidden;margin-bottom:18px;">
        <tr>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Subscription</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Amount</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Cycle</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Renewal Date</th>
        </tr>
        ${newRows}
      </table>
      <h3 style="margin:0 0 8px;font-size:15px;color:#111827;">Other renewals already flagged</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3d54e;border-radius:10px;background:#fffcf0;overflow:hidden;">
        <tr>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Subscription</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Amount</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Cycle</th>
          <th align="left" style="padding:12px 16px;background:#fff3bf;color:#7a6200;font-size:12px;text-transform:uppercase;">Renewal Date</th>
        </tr>
        ${existingRows}
      </table>
    `
  );

  return {
    subject: `TrackerSync Trip Update: ${newSubscriptions.length} new renewal(s) during your trip`,
    text,
    html
  };
}

async function ensureTripReminderTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "TrackerSync".trip_subscription_reminders (
      id BIGSERIAL PRIMARY KEY,
      trip_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      subscription_id BIGINT NOT NULL,
      reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
      first_sent_at TIMESTAMPTZ,
      last_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (trip_id, user_id, subscription_id),
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "TrackerSync".trip_processing_logs (
      id BIGSERIAL PRIMARY KEY,
      trip_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (trip_id, user_id, event_type)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "TrackerSync".trip_notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      trip_id BIGINT NOT NULL,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_notifications_user_created_idx
    ON "TrackerSync".trip_notifications (user_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_sub_reminders_trip_user_idx
    ON "TrackerSync".trip_subscription_reminders (trip_id, user_id)
  `);
}

async function getConfirmedTripParticipants(pool, options = {}) {
  const params = [];
  const filters = ['t.confirmed = TRUE', 't.start_date IS NOT NULL', 't.end_date IS NOT NULL', 't.end_date >= t.start_date'];

  if (options.tripId) {
    params.push(options.tripId);
    filters.push(`t.id = $${params.length}`);
  }

  if (options.userId) {
    params.push(options.userId);
    filters.push(`(
      t.owner_id = $${params.length}
      OR EXISTS (
        SELECT 1
        FROM "TravelSync".trip_shares sx
        WHERE sx.trip_id = t.id
          AND sx.shared_with_user_id = $${params.length}
          AND sx.attendance_confirmed = TRUE
      )
    )`);
  }

  const result = await pool.query(
    `
      SELECT
        t.id AS trip_id,
        t.owner_id,
        t.trip_status,
        t.start_date,
        t.end_date,
        p.user_id,
        p.participant_type
      FROM "TravelSync".trips t
      JOIN LATERAL (
        SELECT t.owner_id::BIGINT AS user_id, 'owner'::TEXT AS participant_type
        UNION ALL
        SELECT s.shared_with_user_id::BIGINT AS user_id, 'shared'::TEXT AS participant_type
        FROM "TravelSync".trip_shares s
        WHERE s.trip_id = t.id
          AND s.attendance_confirmed = TRUE
      ) p ON TRUE
      WHERE ${filters.join(' AND ')}
      ORDER BY t.updated_at DESC NULLS LAST
    `,
    params
  );

  return result.rows;
}

async function getUserEmail(pool, userId) {
  const result = await pool.query('SELECT email FROM accounts WHERE id = $1 LIMIT 1', [userId]);
  if (result.rowCount === 0) return null;
  return result.rows[0].email;
}

async function getTripSubscriptionsForUser(pool, userId, tripStart, tripEnd) {
  const result = await pool.query(
    'SELECT * FROM "TrackerSync".subscriptions WHERE user_id = $1 AND date IS NOT NULL',
    [userId]
  );

  const start = toDateOnly(tripStart);
  const end = toDateOnly(tripEnd);
  if (!start || !end) return [];

  return result.rows.filter((sub) => {
    const subDate = toDateOnly(sub.date);
    if (!subDate) return false;
    return subDate >= start && subDate <= end;
  });
}

async function getReminderStateForTrip(pool, tripId, userId, subscriptionIds) {
  if (!subscriptionIds.length) return new Map();

  const result = await pool.query(
    `
      SELECT subscription_id, reminder_sent
      FROM "TrackerSync".trip_subscription_reminders
      WHERE trip_id = $1
        AND user_id = $2
        AND subscription_id = ANY($3::BIGINT[])
    `,
    [tripId, userId, subscriptionIds]
  );

  const map = new Map();
  for (const row of result.rows) {
    map.set(Number(row.subscription_id), Boolean(row.reminder_sent));
  }
  return map;
}

async function upsertTripSubscriptionRows(pool, tripId, userId, subscriptionIds) {
  if (!subscriptionIds.length) return;

  await pool.query(
    `
      INSERT INTO "TrackerSync".trip_subscription_reminders (trip_id, user_id, subscription_id)
      SELECT $1::BIGINT, $2::BIGINT, unnest($3::BIGINT[])
      ON CONFLICT (trip_id, user_id, subscription_id)
      DO UPDATE SET updated_at = NOW()
    `,
    [tripId, userId, subscriptionIds]
  );
}

async function markSubscriptionsAsSent(pool, tripId, userId, subscriptionIds) {
  if (!subscriptionIds.length) return;

  await pool.query(
    `
      UPDATE "TrackerSync".trip_subscription_reminders
      SET reminder_sent = TRUE,
          first_sent_at = COALESCE(first_sent_at, NOW()),
          last_sent_at = NOW(),
          updated_at = NOW()
      WHERE trip_id = $1
        AND user_id = $2
        AND subscription_id = ANY($3::BIGINT[])
    `,
    [tripId, userId, subscriptionIds]
  );
}

async function hasTripEvent(pool, tripId, userId, eventType) {
  const result = await pool.query(
    `
      SELECT 1
      FROM "TrackerSync".trip_processing_logs
      WHERE trip_id = $1 AND user_id = $2 AND event_type = $3
      LIMIT 1
    `,
    [tripId, userId, eventType]
  );
  return result.rowCount > 0;
}

async function addTripEvent(pool, tripId, userId, eventType) {
  await pool.query(
    `
      INSERT INTO "TrackerSync".trip_processing_logs (trip_id, user_id, event_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (trip_id, user_id, event_type) DO NOTHING
    `,
    [tripId, userId, eventType]
  );
}

async function createTripNotification(pool, { userId, tripId, type, title, message, payload }) {
  await pool.query(
    `
      INSERT INTO "TrackerSync".trip_notifications (
        user_id,
        trip_id,
        notification_type,
        title,
        message,
        payload
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [userId, tripId, type, title, message, JSON.stringify(payload || {})]
  );
}

function createMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendTripEmail(mailer, userEmail, emailPayload) {
  if (!userEmail) return false;

  await mailer.sendMail({
    from: `"TrackerSync" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html
  });

  return true;
}

async function processParticipant(pool, mailer, tripRow) {
  const trip = {
    trip_id: Number(tripRow.trip_id),
    user_id: Number(tripRow.user_id),
    start_date: toIsoDate(tripRow.start_date),
    end_date: toIsoDate(tripRow.end_date),
    participant_type: tripRow.participant_type
  };

  if (!trip.start_date || !trip.end_date) {
    return { sent: false, reason: 'missing_trip_dates' };
  }

  const userEmail = await getUserEmail(pool, trip.user_id);
  if (!userEmail) {
    return { sent: false, reason: 'missing_user_email' };
  }

  const subscriptions = await getTripSubscriptionsForUser(
    pool,
    trip.user_id,
    trip.start_date,
    trip.end_date
  );

  const subscriptionIds = subscriptions.map((s) => Number(s.id));
  await upsertTripSubscriptionRows(pool, trip.trip_id, trip.user_id, subscriptionIds);

  const reminderState = await getReminderStateForTrip(pool, trip.trip_id, trip.user_id, subscriptionIds);

  const initialProcessed = await hasTripEvent(pool, trip.trip_id, trip.user_id, 'initial_processed');

  if (!initialProcessed) {
    if (!subscriptions.length) {
      const emailPayload = buildNoSubscriptionsEmail(trip);
      await sendTripEmail(mailer, userEmail, emailPayload);

      await addTripEvent(pool, trip.trip_id, trip.user_id, 'initial_processed');
      await addTripEvent(pool, trip.trip_id, trip.user_id, 'no_subscriptions_sent');

      await createTripNotification(pool, {
        userId: trip.user_id,
        tripId: trip.trip_id,
        type: 'trip-no-subscriptions',
        title: 'Trip reminder active',
        message: 'No subscriptions currently renew during your trip. We will keep checking hourly.',
        payload: { tripWindow: buildTripWindowText(trip), subscriptions: [] }
      });

      return { sent: true, type: 'initial_no_subscriptions', count: 0 };
    }

    const emailPayload = buildInitialEmail(trip, subscriptions);
    await sendTripEmail(mailer, userEmail, emailPayload);
    await markSubscriptionsAsSent(pool, trip.trip_id, trip.user_id, subscriptionIds);
    await addTripEvent(pool, trip.trip_id, trip.user_id, 'initial_processed');

    await createTripNotification(pool, {
      userId: trip.user_id,
      tripId: trip.trip_id,
      type: 'trip-initial-digest',
      title: 'Trip subscriptions detected',
      message: `${subscriptions.length} subscription(s) renew during your trip.`,
      payload: {
        tripWindow: buildTripWindowText(trip),
        subscriptions: subscriptions.map((sub) => ({
          id: Number(sub.id),
          name: sub.name,
          date: sub.date,
          billingCycle: sub.billingCycle,
          amountPerCycle: sub.amountPerCycle
        }))
      }
    });

    return { sent: true, type: 'initial_digest', count: subscriptions.length };
  }

  if (!subscriptions.length) {
    return { sent: false, reason: 'no_matching_subscriptions_hourly' };
  }

  const newSubscriptions = subscriptions.filter((sub) => !reminderState.get(Number(sub.id)));
  if (!newSubscriptions.length) {
    return { sent: false, reason: 'no_new_subscriptions' };
  }

  const existingSubscriptions = subscriptions.filter((sub) => reminderState.get(Number(sub.id)));
  const emailPayload = buildNewSubscriptionEmail(trip, newSubscriptions, existingSubscriptions);
  await sendTripEmail(mailer, userEmail, emailPayload);
  await markSubscriptionsAsSent(
    pool,
    trip.trip_id,
    trip.user_id,
    newSubscriptions.map((sub) => Number(sub.id))
  );

  await createTripNotification(pool, {
    userId: trip.user_id,
    tripId: trip.trip_id,
    type: 'trip-new-subscription-digest',
    title: 'New subscription renews during trip',
    message: `${newSubscriptions.length} new subscription(s) now renew during your trip.`,
    payload: {
      tripWindow: buildTripWindowText(trip),
      newSubscriptions: newSubscriptions.map((sub) => ({
        id: Number(sub.id),
        name: sub.name,
        date: sub.date,
        billingCycle: sub.billingCycle,
        amountPerCycle: sub.amountPerCycle
      })),
      existingSubscriptions: existingSubscriptions.map((sub) => ({
        id: Number(sub.id),
        name: sub.name,
        date: sub.date,
        billingCycle: sub.billingCycle,
        amountPerCycle: sub.amountPerCycle
      }))
    }
  });

  return { sent: true, type: 'hourly_new_subscription_digest', count: newSubscriptions.length };
}

async function processTripReminders(pool, options = {}) {
  await ensureTripReminderTables(pool);

  const tripParticipants = await getConfirmedTripParticipants(pool, options);
  if (!tripParticipants.length) {
    return {
      ok: true,
      participantsChecked: 0,
      emailsSent: 0,
      results: []
    };
  }

  const mailer = createMailer();
  const results = [];
  let emailsSent = 0;

  for (const participant of tripParticipants) {
    try {
      const result = await processParticipant(pool, mailer, participant);
      if (result.sent) emailsSent += 1;
      results.push({
        tripId: Number(participant.trip_id),
        userId: Number(participant.user_id),
        participantType: participant.participant_type,
        ...result
      });
    } catch (err) {
      results.push({
        tripId: Number(participant.trip_id),
        userId: Number(participant.user_id),
        participantType: participant.participant_type,
        sent: false,
        reason: 'processing_error',
        error: err.message
      });
    }
  }

  return {
    ok: true,
    participantsChecked: tripParticipants.length,
    emailsSent,
    results
  };
}

async function listTripNotifications(pool, userId, limit = 25) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const result = await pool.query(
    `
      SELECT id, trip_id, notification_type, title, message, payload, created_at, read_at
      FROM "TrackerSync".trip_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, safeLimit]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    tripId: Number(row.trip_id),
    notificationType: row.notification_type,
    title: row.title,
    message: row.message,
    payload: row.payload || {},
    createdAt: row.created_at,
    readAt: row.read_at
  }));
}

async function markTripNotificationRead(pool, userId, notificationId) {
  const result = await pool.query(
    `
      UPDATE "TrackerSync".trip_notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [notificationId, userId]
  );

  return result.rowCount > 0;
}

module.exports = {
  ensureTripReminderTables,
  processTripReminders,
  listTripNotifications,
  markTripNotificationRead
};
