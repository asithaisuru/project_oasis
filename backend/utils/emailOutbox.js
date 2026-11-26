import EmailJob from '../models/EmailJob.js';
import Grade from '../models/Grade.js';
import Payment from '../models/Payment.js';
import { sendEmail } from './sendEmail.js';

const models = { Grade, Payment };
async function isCurrent(guard) {
  const record = await models[guard.model].findById(guard.record);
  const timestamp = guard.model === 'Grade' ? record?.publishedAt : record?.paymentDate;
  return record && (guard.model === 'Grade' ? record.isPublished : record.status === 'paid') && Number(timestamp) === Number(guard.eventAt);
}

export async function queueEmail(key, to, subject, html, guard) {
  const recipients = [...new Set(to.filter((value) => typeof value === 'string' && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value)))];
  if (!recipients.length) return { emailSent: false, emailPending: false };
  await EmailJob.updateOne({ _id: key }, { $setOnInsert: { to: recipients, subject, html, guard, status: 'pending', attempts: 0, nextAttempt: new Date() } }, { upsert: true });
  await deliverEmail(key);
  const job = await EmailJob.findById(key);
  return { emailSent: job.status === 'sent', emailPending: ['pending', 'sending'].includes(job.status), emailError: job.status === 'failed' ? 'Delivery failed after bounded retries; administrator action required' : undefined };
}

export async function deliverEmail(key) {
  const now = new Date();
  await EmailJob.updateMany({ status: 'sending', attempts: { $gte: 5 }, leaseUntil: { $lte: now } }, { status: 'failed', leaseUntil: null, lastError: 'Delivery lease expired after final attempt' });
  const job = await EmailJob.findOneAndUpdate({
    ...(key ? { _id: key } : {}), attempts: { $lt: 5 },
    $or: [{ status: 'pending', nextAttempt: { $lte: now } }, { status: 'sending', leaseUntil: { $lte: now } }],
  }, { $set: { status: 'sending', leaseUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } }, { new: true, sort: { nextAttempt: 1 } });
  if (!job) return false;
  try {
    if (!await isCurrent(job.guard)) {
      await EmailJob.updateOne({ _id: job._id, status: 'sending' }, { status: 'cancelled', leaseUntil: null });
      return true;
    }
    await sendEmail(job.to.join(','), job.subject, job.html);
    await EmailJob.updateOne({ _id: job._id }, { status: 'sent', sentAt: new Date(), leaseUntil: null, lastError: null });
  } catch {
    // SMTP details can contain recipients or credentials; retain a generic diagnosis.
    await EmailJob.updateOne({ _id: job._id }, { status: job.attempts >= 5 ? 'failed' : 'pending', nextAttempt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts)), leaseUntil: null, lastError: 'SMTP delivery failed' });
  }
  return true;
}

export async function reconcileNotifications() {
  const { sendGradeEmail } = await import('../controllers/gradeController.js');
  const { sendPaymentEmail } = await import('../controllers/paymentController.js');
  for (const grade of await Grade.find({ notificationPending: true, isPublished: true }).limit(50).populate('student').populate('class')) {
    if (!grade.student) continue;
    await sendGradeEmail(grade, [grade.student.email, grade.student.parentEmail]);
  }
  for (const payment of await Payment.find({ notificationPending: true, status: 'paid' }).limit(50).populate('student').populate('class')) {
    if (!payment.student) continue;
    await sendPaymentEmail(payment);
  }
}

export function startEmailWorker() {
  let running = null;
  const run = () => {
    if (running) return;
    running = (async () => { await reconcileNotifications(); for (let count = 0; count < 50 && await deliverEmail(); count++); })().catch(() => { console.error('Email outbox retry failed; pending records retained'); }).finally(() => { running = null; });
  };
  const interval = setInterval(run, 15000);
  interval.unref(); run();
  return async () => { clearInterval(interval); if (running) await running; };
}
