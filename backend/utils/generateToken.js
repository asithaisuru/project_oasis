import { createSession } from './sessions.js';
// Existing callers must await the returned revocable session token.
export default async function generateToken(id) { return (await createSession({ _id: id })).token; }
