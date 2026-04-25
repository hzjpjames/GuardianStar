// src/services/locationService.js
// v6.0 - 楂樺痉瀹氫綅浼樺厛 + 鍘熺敓GPS鍏滃簳 + IP瀹氫綅淇濆簳

import * as Location from 'expo-location';
import { reportLocation as apiReportLocation } from '../api';
import { getAmapLocation, amapIpLocate, amapRegeocode } from './amapLocationService';

const USE_AMAP_FIRST = true;  // 鏄惁浼樺厛浣跨敤楂樺痉瀹氫綅

// 鈹€鈹€ 鍘熺敓GPS瀹氫綅锛堝鐢ㄦ柟妗堬級 鈹€鈹€
export async function getSystemGps(timeoutMs = 30000) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('瀹氫綅鏉冮檺鏈巿鏉?);
  }
  
  console.log('[鍘熺敓GPS] 寮€濮嬪畾浣?..');

  // 绛栫暐1: getCurrentPositionAsync + High绮惧害
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
      timeout: 20000,
    });
    console.log('[鍘熺敓GPS] 鉁?, loc.coords.latitude.toFixed(4), loc.coords.longitude.toFixed(4));
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy || 100,
      altitude: loc.coords.altitude || 0,
      speed: loc.coords.speed || 0,
      timestamp: loc.timestamp,
      source: '鍘熺敓GPS',
    };
  } catch (e1) {
    console.log('[鍘熺敓GPS] 澶辫触:', e1.message);
    throw e1;
  }
}

// 鈹€鈹€ 楂樺痉瀹氫綅锛堥閫夋柟妗堬級 鈹€鈹€
export async function getAmapGps() {
  try {
    console.log('[楂樺痉瀹氫綅] 寮€濮?..');
    const loc = await getAmapLocation();
    console.log('[楂樺痉瀹氫綅] 鉁?, loc.source, loc.latitude.toFixed(4), loc.longitude.toFixed(4));
    return loc;
  } catch (e) {
    console.log('[楂樺痉瀹氫綅] 鉂?, e.message);
    throw e;
  }
}

// 鈹€鈹€ IP瀹氫綅锛堜繚搴曟柟妗堬級 鈹€鈹€
export async function ipLocate() {
  try {
    // 浼樺厛浣跨敤楂樺痉IP瀹氫綅
    return await amapIpLocate();
  } catch (e) {
    console.log('[楂樺痉IP澶辫触锛屼娇鐢ㄥ鐢↖P瀹氫綅]');
  }
  
  // 澶囩敤IP瀹氫綅
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,message,country,city,lat,lon');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status === 'fail') throw new Error(json.message || 'IP瀹氫綅澶辫触');
    console.log('[IP瀹氫綅] 鉁?, json.city, json.lat, json.lon);
    return { 
      latitude: json.lat, 
      longitude: json.lon, 
      accuracy: 3000, 
      altitude: 0, 
      speed: 0, 
      timestamp: Date.now(), 
      source: 'IP瀹氫綅' 
    };
  } catch (e) {
    console.log('[IP瀹氫綅] 鉂?, e.message);
    throw new Error('IP瀹氫綅澶辫触: ' + e.message);
  }
}

// 鈹€鈹€ 鏅鸿兘瀹氫綅锛氶珮寰蜂紭鍏?鈫?鍘熺敓GPS 鈫?IP鍏滃簳 鈹€鈹€
export async function getCurrentLocation() {
  const errors = [];
  
  // 绛栫暐1: 楂樺痉瀹氫綅锛堝浗鍐呭吋瀹规€ф渶濂斤級
  if (USE_AMAP_FIRST) {
    try {
      console.log('[瀹氫綅] 绛栫暐1: 楂樺痉瀹氫綅...');
      return await getAmapGps();
    } catch (e) {
      errors.push('楂樺痉:' + e.message);
      console.log('[瀹氫綅] 楂樺痉澶辫触锛岄檷绾у師鐢烥PS');
    }
  }
  
  // 绛栫暐2: 鍘熺敓GPS
  try {
    console.log('[瀹氫綅] 绛栫暐2: 鍘熺敓GPS...');
    return await getSystemGps(30000);
  } catch (e) {
    errors.push('鍘熺敓GPS:' + e.message);
    console.log('[瀹氫綅] 鍘熺敓GPS澶辫触锛岄檷绾P瀹氫綅');
  }
  
  // 绛栫暐3: IP瀹氫綅锛堜繚搴曪級
  try {
    console.log('[瀹氫綅] 绛栫暐3: IP瀹氫綅...');
    return await ipLocate();
  } catch (e) {
    errors.push('IP:' + e.message);
    throw new Error('鎵€鏈夊畾浣嶆柟妗堥兘澶辫触: ' + errors.join('; '));
  }
}

// 鈹€鈹€ 鍚庡彴鎸佺画瀹氫綅 鈹€鈹€
let _watchSubscription = null;

export async function startBackgroundGps(onUpdate) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[鍚庡彴瀹氫綅] 鏃犳潈闄?);
      onUpdate({ source: 'IP瀹氫綅', error: '鏃犳潈闄? });
      return;
    }
    
    _watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 30000,
      },
      (loc) => {
        console.log('[鍚庡彴瀹氫綅] 鏇存柊:', loc.coords.latitude.toFixed(4), loc.coords.longitude.toFixed(4));
        onUpdate({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy || 100,
          altitude: loc.coords.altitude || 0,
          speed: loc.coords.speed || 0,
          timestamp: loc.timestamp,
          source: '鍘熺敓GPS',
        });
      }
    );
    console.log('[鍚庡彴瀹氫綅] 宸插惎鍔?);
  } catch (e) {
    console.log('[鍚庡彴瀹氫綅] 鍚姩澶辫触:', e.message);
  }
}

export function stopBackgroundGps() {
  if (_watchSubscription) {
    _watchSubscription.remove();
    _watchSubscription = null;
    console.log('[鍚庡彴瀹氫綅] 宸插仠姝?);
  }
}

// 鈹€鈹€ 鏉冮檺妫€鏌?鈹€鈹€
export async function requestLocationPermissions() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { foreground: status === 'granted' };
  } catch (e) {
    return { foreground: false };
  }
}

// 鈹€鈹€ 涓婃姤浣嶇疆鍒板悗绔?鈹€鈹€
export async function reportLocation(userId, locationData) {
  try {
    const result = await apiReportLocation(userId, locationData);
    return result.success;
  } catch (error) {
    console.error('涓婃姤浣嶇疆澶辫触:', error);
    return false;
  }
}

// 鈹€鈹€ 楂樺痉閫嗗湴鐞嗙紪鐮侊紙鑾峰彇鍦板潃锛?鈹€鈹€
export async function getAddressFromCoords(latitude, longitude) {
  try {
    return await amapRegeocode(latitude, longitude);
  } catch (e) {
    console.log('閫嗗湴鐞嗙紪鐮佸け璐?', e.message);
    return null;
  }
}

// 鈹€鈹€ 鍏煎鏃ф帴鍙?鈹€鈹€
export function getWebViewGeoScript() { return 'true;'; }
export function getGeoWebViewHtml() { return '<!DOCTYPE html><html><body></body></html>'; }
export function onWebViewGpsResult() {}
