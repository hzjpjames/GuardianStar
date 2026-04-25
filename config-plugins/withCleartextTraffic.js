// 鑷畾涔?Config Plugin锛氱敓鎴?network_security_config.xml 骞舵敞鍐屽埌 manifest
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">192.168.1.0</domain>
        <domain includeSubdomains="true">10.0.0.0</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;

module.exports = function withCleartextTraffic(config) {
  // Step 1: 鐢熸垚 network_security_config.xml 鏂囦欢
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      const xmlPath = path.join(xmlDir, 'network_security_config.xml');

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      fs.writeFileSync(xmlPath, NETWORK_SECURITY_CONFIG, 'utf8');
      console.log('[withCleartextTraffic] Wrote network_security_config.xml to:', xmlPath);

      return config;
    },
  ]);

  // Step 2: 淇敼 AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    // Expo SDK 55: application is an array
    const app = Array.isArray(manifest.application) ? manifest.application[0] : manifest.application;

    if (app && app.$) {
      app.$['android:usesCleartextTraffic'] = 'true';
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      console.log('[withCleartextTraffic] Updated AndroidManifest.xml: usesCleartextTraffic=true, networkSecurityConfig=@xml/network_security_config');
    } else {
      console.warn('[withCleartextTraffic] Could not find <application> element in manifest!');
    }

    return config;
  });

  return config;
};
