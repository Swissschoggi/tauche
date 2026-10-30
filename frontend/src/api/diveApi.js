import axios from "axios";

const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const backendBaseUrl = isDevelopment 
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : ''; 

const api = axios.create({
  baseURL: backendBaseUrl ? `${backendBaseUrl}/api` : '/api', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("user_session_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isAuthEndpoint = error.config && error.config.url && error.config.url.includes('/auth/');
      if (!isAuthEndpoint) {
        const token = localStorage.getItem("user_session_token");
        if (token) {
          localStorage.removeItem("user_session_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

function sha256Sync(str) {
  const chrsz = 8;
  function safeAdd(x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    return (((x >>> 16) + (y >>> 16) + (lsw >>> 16)) << 16) | (lsw & 0xFFFF);
  }
  function S(X, n) { return (X >>> n) | (X << (32 - n)); }
  function R(X, n) { return X >>> n; }
  function Ch(x, y, z) { return (x & y) ^ (~x & z); }
  function Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
  function Sigma0(x) { return S(x, 2) ^ S(x, 13) ^ S(x, 22); }
  function Sigma1(x) { return S(x, 6) ^ S(x, 11) ^ S(x, 25); }
  function sigma0(x) { return S(x, 7) ^ S(x, 18) ^ R(x, 3); }
  function sigma1(x) { return S(x, 17) ^ S(x, 19) ^ R(x, 10); }
  const K = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
  ];
  const msg = [];
  const len = str.length * chrsz;
  for (let i = 0; i < str.length; i++) msg[i >>> 2] |= str.charCodeAt(i) << (24 - (i % 4) * 8);
  msg[len >>> 5] |= 0x80 << (24 - (len % 32));
  msg[(((len + 64) >>> 9) << 4) + 15] = len;
  let H0 = 0x6A09E667, H1 = 0xBB67AE85, H2 = 0x3C6EF372, H3 = 0xA54FF53A;
  let H4 = 0x510E527F, H5 = 0x9B05688C, H6 = 0x1F83D9AB, H7 = 0x5BE0CD19;
  const W = new Array(64);
  for (let i = 0; i < msg.length; i += 16) {
    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      if (t < 16) W[t] = msg[i + t] || 0;
      else W[t] = safeAdd(safeAdd(safeAdd(sigma1(W[t - 2]), W[t - 7]), sigma0(W[t - 15])), W[t - 16]);
      const T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, Sigma1(e)), Ch(e, f, g)), K[t]), W[t]);
      const T2 = safeAdd(Sigma0(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safeAdd(d, T1); d = c; c = b; b = a; a = safeAdd(T1, T2);
    }
    H0 = safeAdd(H0, a); H1 = safeAdd(H1, b); H2 = safeAdd(H2, c); H3 = safeAdd(H3, d);
    H4 = safeAdd(H4, e); H5 = safeAdd(H5, f); H6 = safeAdd(H6, g); H7 = safeAdd(H7, h);
  }
  return ((H0.toString(16).padStart(8, "0")) + (H1.toString(16).padStart(8, "0"))
    + (H2.toString(16).padStart(8, "0")) + (H3.toString(16).padStart(8, "0"))
    + (H4.toString(16).padStart(8, "0")) + (H5.toString(16).padStart(8, "0"))
    + (H6.toString(16).padStart(8, "0")) + (H7.toString(16).padStart(8, "0")));
}

async function sha256(str) {
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    try {
      const buf = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (_) {
      return sha256Sync(str);
    }
  }
  return sha256Sync(str);
}

export async function loginUser(email, password) {
  const response = await api.post("/auth/login", { email, password });
  return response;
}

export async function registerUser(email, password) {
  const response = await api.post("/auth/register", { email, password });
  return response;
}

export async function logoutUser() {
  const response = await api.post("/auth/logout");
  return response;
}

export async function getAllDives() {
  try {
    const response = await api.get("/dives");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching all dives:", error);
    return []; 
  }
}

export async function getDiveById(id) {
  const response = await api.get(`/dives/${id}`);
  return response.data;
}

export async function createDive(diveData) {
  const response = await api.post("/dives", diveData);
  return response.data;
}

export async function updateDive(id, payload) {
  const response = await api.put(`/dives/${id}`, payload);
  return response.data;
}

export async function uploadDiveImage(id, file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post(`/dives/${id}/upload-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteDive(id) {
  const response = await api.delete(`/dives/${id}`);
  return response.data;
}

export async function getDiverProfile() {
  const response = await api.get("/auth/profile");
  return response.data;
}

export async function getProfile() {
  const response = await api.get("/auth/profile");
  return response.data;
}

// ── Admin API ──
export async function adminGetUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

export async function adminGetStats() {
  const response = await api.get("/admin/stats");
  return response.data;
}

export async function adminUpdateRole(userId, role) {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function adminToggleEnabled(userId) {
  const response = await api.put(`/admin/users/${userId}/toggle-enabled`);
  return response.data;
}

export async function adminDeleteUser(userId) {
  await api.delete(`/admin/users/${userId}`);
}

// ── Buddy API ──
export async function sendBuddyRequest(userId) {
  const response = await api.post("/buddies/request", { userId });
  return response.data;
}

export async function acceptBuddyRequest(buddyId) {
  const response = await api.put(`/buddies/accept/${buddyId}`);
  return response.data;
}

export async function removeBuddy(buddyId) {
  await api.delete(`/buddies/${buddyId}`);
}

export async function getBuddies() {
  const response = await api.get("/buddies");
  return response.data;
}

export async function getPendingBuddyRequests() {
  const response = await api.get("/buddies/pending");
  return response.data;
}

export async function getOutgoingBuddyRequests() {
  const response = await api.get("/buddies/outgoing");
  return response.data;
}

export async function searchUsers(q) {
  const response = await api.get("/buddies/search", { params: { q } });
  return response.data;
}

export async function getBuddyProfile(buddyUserId) {
  const response = await api.get(`/buddies/profile/${buddyUserId}`);
  return response.data;
}

export async function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (isDevelopment) {
    return `${backendBaseUrl}${imagePath}`;
  }
  return imagePath;
}

export async function getEquipmentCloset() {
  try {
    const response = await api.get("/equipment");
    console.log("Equipment API response:", response); 
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching equipment closet:", error);
    return [];
  }
}

export async function addEquipmentItem(equipmentData) {
  const response = await api.post("/equipment", equipmentData);
  console.log("Add equipment response:", response);
  return response.data;
}

export async function updateEquipmentItem(id, equipmentData) {
  const response = await api.put(`/equipment/${id}`, equipmentData);
  console.log("Update equipment response:", response);
  return response.data;
}

export async function removeEquipmentItem(id) {
  const response = await api.delete(`/equipment/${id}`);
  return response.data;
}

export async function getGalleryImages(diveId) {
  try {
    const response = await api.get(`/dives/${diveId}/gallery`);
    return response.data;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return [];
  }
}

export async function uploadGalleryImage(diveId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post(`/dives/${diveId}/gallery/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteGalleryImage(diveId, imageId) {
  const response = await api.delete(`/dives/${diveId}/gallery/${imageId}`);
  return response.data;
}

export async function updateGalleryImageTags(diveId, imageId, tags) {
  const response = await api.put(`/dives/${diveId}/gallery/${imageId}/tags`, { tags });
  return response.data;
}

export async function createShareLink(diveId) {
  try {
    const response = await api.post(`/dives/${diveId}/share`);
    return response.data;
  } catch (error) {
    console.error("Error creating share link:", error);
    throw error;
  }
}

export async function getSharedDive(token) {
  try {
    const response = await api.get(`/dives/share/${token}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching shared dive:", error);
    throw error;
  }
}

// Certification endpoints
export async function getCertifications() {
  try {
    const response = await api.get("/certifications");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return [];
  }
}

export async function getActiveCertifications() {
  try {
    const response = await api.get("/certifications/active");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching active certifications:", error);
    return [];
  }
}

export async function getExpiringCertifications(daysUntilExpiry = 30) {
  try {
    const response = await api.get("/certifications/expiring", {
      params: { daysUntilExpiry }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching expiring certifications:", error);
    return [];
  }
}

export async function createCertification(certData) {
  const response = await api.post("/certifications", certData);
  return response.data;
}

export async function updateCertification(id, certData) {
  const response = await api.put(`/certifications/${id}`, certData);
  return response.data;
}

export async function deleteCertification(id) {
  const response = await api.delete(`/certifications/${id}`);
  return response.data;
}

// Trip endpoints
export async function getTrips() {
  try {
    const response = await api.get("/trips");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching trips:", error);
    return [];
  }
}

export async function getUpcomingTrips() {
  try {
    const response = await api.get("/trips/upcoming");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching upcoming trips:", error);
    return [];
  }
}

export async function getTripById(id) {
  const response = await api.get(`/trips/${id}`);
  return response.data;
}

export async function createTrip(tripData) {
  const response = await api.post("/trips", tripData);
  return response.data;
}

export async function updateTrip(id, tripData) {
  const response = await api.put(`/trips/${id}`, tripData);
  return response.data;
}

export async function deleteTrip(id) {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
}

export async function addDiveToTrip(tripId, diveId) {
  const response = await api.post(`/trips/${tripId}/dives/${diveId}`);
  return response.data;
}

export async function removeDiveFromTrip(tripId, diveId) {
  const response = await api.delete(`/trips/${tripId}/dives/${diveId}`);
  return response.data;
}

export async function suggestLocations(query) {
  const response = await api.get("/dive-shops/suggest", { params: { q: query } });
  return response.data;
}

export async function getNearbyDiveShops({ lat, lng, location, radius = 5000 } = {}) {
  const params = { radius }
  if (lat != null && lng != null) {
    params.lat = lat
    params.lng = lng
  }
  if (location) {
    params.location = location
  }
  const response = await api.get("/dive-shops/nearby", { params });
  return response.data;
}

export async function getSightings() {
  const response = await api.get("/dives/sightings");
  return response.data;
}