import Counter from '../models/Counter.js';

// Seed from the greatest numeric suffix, preserving gaps and all existing IDs.
// $max and $inc are atomic across processes; allocating an ID may leave a gap.
export async function allocateHumanId(model, field, prefix, supplied) {
  const rows = await model.aggregate([
    { $match: { [field]: { $regex: `^${prefix}[0-9]+$` } } },
    { $project: { suffix: { $convert: { input: { $substrCP: [`$${field}`, prefix.length, { $strLenCP: `$${field}` }] }, to: 'long', onError: 0, onNull: 0 } } } },
    { $group: { _id: null, maximum: { $max: '$suffix' } } },
  ]);
  const suppliedNumber = typeof supplied === 'string' && new RegExp(`^${prefix}[0-9]+$`).test(supplied) ? Number(supplied.slice(prefix.length)) : 0;
  const maximum = Math.max(Number(rows[0]?.maximum || 0), suppliedNumber);
  try { await Counter.updateOne({ _id: prefix }, { $max: { sequence: maximum } }, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; await Counter.updateOne({ _id: prefix }, { $max: { sequence: maximum } }); }
  if (supplied) return supplied;
  const counter = await Counter.findOneAndUpdate({ _id: prefix }, { $inc: { sequence: 1 } }, { new: true });
  return `${prefix}${String(counter.sequence).padStart(4, '0')}`;
}
