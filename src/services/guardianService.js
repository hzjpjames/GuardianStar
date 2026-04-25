// src/services/guardianService.js - 瀹堟姢鏈嶅姟
import { getLocation, getHistory, getBindings, createBinding, removeBinding as apiRemoveBinding } from '../api';

// 鑾峰彇璁惧褰撳墠浣嶇疆
export async function getTrackedLocation(trackedUid) {
  const result = await getLocation(trackedUid);
  if (result.success) {
    return result.location;
  }
  return null;
}

// 鑾峰彇鍘嗗彶杞ㄨ抗
export async function getLocationHistory(trackedUid, hours = 24) {
  const result = await getHistory(trackedUid, hours);
  if (result.success) {
    return result.locations.map(loc => ({
      ...loc,
      createdAt: new Date(loc.timestamp)
    }));
  }
  return [];
}

// 鑾峰彇瀹堟姢鍏崇郴鍒楄〃
export async function getGuardianBindings(guardianUid) {
  try {
    const result = await getBindings(guardianUid);
    if (result.success && result.bindings) {
      return result.bindings;
    }
    return [];
  } catch (e) {
    console.error('鑾峰彇缁戝畾澶辫触:', e);
    return [];
  }
}

// 鍒涘缓瀹堟姢鍏崇郴
export async function createGuardianBinding(guardianUid, trackedUid, nickname) {
  try {
    const result = await createBinding(guardianUid, trackedUid, nickname);
    if (result.success) {
      return result.bindingId || result.binding?.id;
    }
    throw new Error(result.message || '缁戝畾澶辫触');
  } catch (e) {
    console.error('鍒涘缓缁戝畾澶辫触:', e);
    throw e;
  }
}

// 瑙ｉ櫎瀹堟姢鍏崇郴
export async function removeGuardianBinding(bindingId) {
  try {
    const result = await apiRemoveBinding(bindingId);
    return result.success;
  } catch (e) {
    console.error('瑙ｉ櫎缁戝畾澶辫触:', e);
    return false;
  }
}