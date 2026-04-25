// src/services/amapLocationService.js
// 楂樺痉瀹氫綅鏈嶅姟 - 浣跨敤娣峰悎绛栫暐锛氬師鐢烥PS + 楂樺痉Web API + IP瀹氫綅

import * as Location from 'expo-location';

const AMAP_KEY = 'ea5aa93cb5ed3de2a5c701434dc3e781';
const AMAP_JSAPI_KEY = 'ea5aa93cb5ed3de2a5c701434dc3e781'; // 鍚屼竴涓狵ey鍙互鐢ㄤ簬JSAPI

// 鈹€鈹€ 楂樺痉IP瀹氫綅锛堝厤璐癸紝鏃犻渶SDK锛?鈹€鈹€
export async function amapIpLocate() {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}&output=JSON`
    );
    const json = await res.json();
    
    if (json.status === '1' && json.rectangle) {
      // 瑙ｆ瀽rectangle鑾峰彇涓績鐐?      const coords = json.rectangle.split(';');
      const [sw, ne] = coords;
      const [swLng, swLat] = sw.split(',').map(Number);
      const [neLng, neLat] = ne.split(',').map(Number);
      const centerLat = (swLat + neLat) / 2;
      const centerLng = (swLng + neLng) / 2;
      
      console.log('[楂樺痉IP瀹氫綅] 鉁?, json.city, centerLat, centerLng);
      return {
        latitude: centerLat,
        longitude: centerLng,
        accuracy: 3000,
        altitude: 0,
        speed: 0,
        timestamp: Date.now(),
        source: '楂樺痉IP',
        city: json.city,
      };
    }
    throw new Error(json.info || 'IP瀹氫綅澶辫触');
  } catch (e) {
    console.log('[楂樺痉IP瀹氫綅] 鉂?, e.message);
    throw e;
  }
}

// 鈹€鈹€ 楂樺痉鍛ㄨ竟鎼滅储瀹氫綅锛堝熀浜嶹iFi/鍩虹珯锛岄渶瑕丠TTPS锛?鈹€鈹€
export async function amapNearbyLocate() {
  try {
    // 鑾峰彇褰撳墠浣嶇疆锛堢矖鐣ワ級鐢ㄤ簬鍛ㄨ竟鎼滅储
    const res = await fetch(
      `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=120.29496,30.42751&radius=1000&output=JSON&offset=1`
    );
    const json = await res.json();
    
    if (json.status === '1' && json.pois && json.pois.length > 0) {
      const poi = json.pois[0];
      const [lng, lat] = poi.location.split(',').map(Number);
      console.log('[楂樺痉鍛ㄨ竟] 鉁?, poi.name, lat, lng);
      return {
        latitude: lat,
        longitude: lng,
        accuracy: 500,
        altitude: 0,
        speed: 0,
        timestamp: Date.now(),
        source: '楂樺痉鍛ㄨ竟',
        address: poi.name,
      };
    }
    throw new Error('鍛ㄨ竟鎼滅储鏃犵粨鏋?);
  } catch (e) {
    console.log('[楂樺痉鍛ㄨ竟] 鉂?, e.message);
    throw e;
  }
}

// 鈹€鈹€ 楂樺痉娴忚鍣ㄥ畾浣嶏紙HTML5 Geolocation + 楂樺痉閫嗗湴鐞嗙紪鐮侊級 鈹€鈹€
export async function amapBrowserLocate() {
  return new Promise((resolve, reject) => {
    if (!navigator || !navigator.geolocation) {
      reject(new Error('娴忚鍣ㄤ笉鏀寔瀹氫綅'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          
          // 浣跨敤楂樺痉閫嗗湴鐞嗙紪鐮佽幏鍙栧湴鍧€
          const res = await fetch(
            `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&output=JSON`
          );
          const json = await res.json();
          
          console.log('[楂樺痉娴忚鍣╙ 鉁?, latitude, longitude, json.regeocode?.formatted_address);
          resolve({
            latitude,
            longitude,
            accuracy: accuracy || 100,
            altitude: position.coords.altitude || 0,
            speed: position.coords.speed || 0,
            timestamp: position.timestamp,
            source: '楂樺痉娴忚鍣?,
            address: json.regeocode?.formatted_address,
          });
        } catch (e) {
          // 閫嗗湴鐞嗙紪鐮佸け璐ワ紝杩斿洖鍘熷鍧愭爣
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 100,
            altitude: position.coords.altitude || 0,
            speed: position.coords.speed || 0,
            timestamp: position.timestamp,
            source: '楂樺痉娴忚鍣?,
          });
        }
      },
      (error) => {
        reject(new Error('娴忚鍣ㄥ畾浣嶅け璐? ' + error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  });
}

// 鈹€鈹€ 鍘熺敓GPS + 楂樺痉閫嗗湴鐞嗙紪鐮?鈹€鈹€
export async function amapNativeGps() {
  try {
    // 鍏堣幏鍙栧師鐢烥PS鍧愭爣
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('瀹氫綅鏉冮檺鏈巿鏉?);
    }
    
    console.log('[楂樺痉鍘熺敓GPS] 鑾峰彇鍘熺敓鍧愭爣...');
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
      timeout: 20000,
    });
    
    const { latitude, longitude, accuracy, altitude, speed } = loc.coords;
    
    // 浣跨敤楂樺痉閫嗗湴鐞嗙紪鐮?    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&output=JSON&extensions=all`
      );
      const json = await res.json();
      
      if (json.status === '1') {
        const address = json.regeocode;
        console.log('[楂樺痉鍘熺敓GPS] 鉁?, latitude, longitude, address.formatted_address);
        return {
          latitude,
          longitude,
          accuracy: accuracy || 50,
          altitude: altitude || 0,
          speed: speed || 0,
          timestamp: loc.timestamp,
          source: '楂樺痉GPS',
          address: address.formatted_address,
          city: address.addressComponent?.city,
          district: address.addressComponent?.district,
        };
      }
    } catch (e) {
      console.log('[楂樺痉鍘熺敓GPS] 閫嗗湴鐞嗙紪鐮佸け璐ワ紝杩斿洖鍘熷鍧愭爣');
    }
    
    return {
      latitude,
      longitude,
      accuracy: accuracy || 50,
      altitude: altitude || 0,
      speed: speed || 0,
      timestamp: loc.timestamp,
      source: '楂樺痉GPS',
    };
  } catch (e) {
    console.log('[楂樺痉鍘熺敓GPS] 鉂?, e.message);
    throw e;
  }
}

// 鈹€鈹€ 鏅鸿兘瀹氫綅锛氶珮寰峰绛栫暐铻嶅悎 鈹€鈹€
export async function getAmapLocation() {
  const errors = [];
  
  // 绛栫暐1: 鍘熺敓GPS + 楂樺痉閫嗗湴鐞嗙紪鐮侊紙鏈€鍑嗭級
  try {
    console.log('[楂樺痉瀹氫綅] 绛栫暐1: 鍘熺敓GPS...');
    return await amapNativeGps();
  } catch (e) {
    errors.push('鍘熺敓GPS: ' + e.message);
    console.log('[楂樺痉瀹氫綅] 绛栫暐1澶辫触:', e.message);
  }
  
  // 绛栫暐2: 娴忚鍣ㄥ畾浣嶏紙濡傛灉鍦╓eb鐜锛?  try {
    console.log('[楂樺痉瀹氫綅] 绛栫暐2: 娴忚鍣ㄥ畾浣?..');
    return await amapBrowserLocate();
  } catch (e) {
    errors.push('娴忚鍣? ' + e.message);
    console.log('[楂樺痉瀹氫綅] 绛栫暐2澶辫触:', e.message);
  }
  
  // 绛栫暐3: 楂樺痉IP瀹氫綅锛堜繚搴曪級
  try {
    console.log('[楂樺痉瀹氫綅] 绛栫暐3: IP瀹氫綅...');
    return await amapIpLocate();
  } catch (e) {
    errors.push('IP瀹氫綅: ' + e.message);
    console.log('[楂樺痉瀹氫綅] 绛栫暐3澶辫触:', e.message);
  }
  
  throw new Error('楂樺痉瀹氫綅鍏ㄩ儴澶辫触: ' + errors.join('; '));
}

// 鈹€鈹€ 楂樺痉鍦扮悊缂栫爜锛堝湴鍧€杞潗鏍囷級 鈹€鈹€
export async function amapGeocode(address) {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(address)}&output=JSON`
    );
    const json = await res.json();
    
    if (json.status === '1' && json.geocodes && json.geocodes.length > 0) {
      const loc = json.geocodes[0];
      const [lng, lat] = loc.location.split(',').map(Number);
      return { latitude: lat, longitude: lng, address: loc.formatted_address };
    }
    throw new Error('鍦扮悊缂栫爜澶辫触');
  } catch (e) {
    throw new Error('鍦扮悊缂栫爜澶辫触: ' + e.message);
  }
}

// 鈹€鈹€ 楂樺痉閫嗗湴鐞嗙紪鐮侊紙鍧愭爣杞湴鍧€锛?鈹€鈹€
export async function amapRegeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&output=JSON&extensions=all`
    );
    const json = await res.json();
    
    if (json.status === '1') {
      return {
        address: json.regeocode.formatted_address,
        city: json.regeocode.addressComponent?.city,
        district: json.regeocode.addressComponent?.district,
        street: json.regeocode.addressComponent?.street,
      };
    }
    throw new Error('閫嗗湴鐞嗙紪鐮佸け璐?);
  } catch (e) {
    throw new Error('閫嗗湴鐞嗙紪鐮佸け璐? ' + e.message);
  }
}
