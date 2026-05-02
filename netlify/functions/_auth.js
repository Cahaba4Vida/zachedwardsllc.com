const crypto = require('crypto');
const { json } = require('./_util');
const { ensureUserProfile, ensureDeviceIdentity, linkDeviceToUser, resolveUserIdByDevice } = require('./_db');

function getIdentityUser(event) {
  try {
    const ctx = event?.headers?.['x-nf-client-connection-ip']; // noop; keeps Netlify bundler happy
  } catch {}
  return null;
}

function getHeader(event, name) {
  const headers = event.headers || {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : null;
}

function parseJwtUser(event) {
  const auth = getHeader(event, 'authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.slice(7);
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return {
      id: payload.sub,
      email: payload.email || null,
    };
  } catch {
    return null;
  }
}

function normalizeDeviceId(raw) {
  const value = String(raw || '').trim();
  if (!value || !/^[A-Za-z0-9._-]{12,200}$/.test(value)) return null;
  return value;
}

function stableDeviceUserId(deviceId) {
  const hash = crypto.createHash('sha256').update(String(deviceId)).digest('hex').slice(0, 40);
  return `device_${hash}`;
}

async function requireUser(event) {
  const deviceId = normalizeDeviceId(getHeader(event, 'x-device-id'));
  const authUser = parseJwtUser(event);

  let deviceKnown = false;
  if (deviceId) {
    const deviceInfo = await ensureDeviceIdentity(deviceId);
    deviceKnown = !!deviceInfo?.knownBefore;
  }

  if (authUser?.id) {
    await ensureUserProfile(authUser.id, authUser.email);
    if (deviceId) {
      await linkDeviceToUser(deviceId, authUser.id);
      deviceKnown = true;
    }
    return {
      ok: true,
      user: {
        userId: authUser.id,
        email: authUser.email,
        deviceId,
        device_known: deviceKnown,
        identity_type: 'user',
      },
    };
  }

  if (!deviceId) return { ok: false, response: json(401, { error: 'Missing device identity' }) };

  const linkedUserId = await resolveUserIdByDevice(deviceId);
  if (linkedUserId) {
    return {
      ok: true,
      user: {
        userId: linkedUserId,
        email: null,
        deviceId,
        device_known: true,
        identity_type: 'device_linked',
      },
    };
  }

  const userId = stableDeviceUserId(deviceId);
  await ensureUserProfile(userId, null);
  return {
    ok: true,
    user: {
      userId,
      email: null,
      deviceId,
      device_known: deviceKnown,
      identity_type: 'device_anonymous',
    },
  };
}

module.exports = { requireUser };
