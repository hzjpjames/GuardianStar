const { withAndroidManifest, withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withAmapLocation = (config, { apiKey }) => {
  // 1. 淇敼 AndroidManifest.xml 娣诲姞楂樺痉Key鍜屾潈闄?
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const app = manifest.application[0];
    
    // 娣诲姞楂樺痉瀹氫綅鏈嶅姟澹版槑
    if (!app.service) {
      app.service = [];
    }
    const hasService = app.service.some(s => s.$['android:name'] === 'com.amap.api.location.APSService');
    if (!hasService) {
      app.service.push({
        $: {
          'android:name': 'com.amap.api.location.APSService',
          'android:enabled': 'true',
          'android:exported': 'false'
        }
      });
    }
    
    // 娣诲姞楂樺痉Key鍒癿eta-data
    if (!app['meta-data']) {
      app['meta-data'] = [];
    }
    const hasKey = app['meta-data'].some(m => m.$['android:name'] === 'com.amap.api.v2.apikey');
    if (!hasKey) {
      app['meta-data'].push({
        $: {
          'android:name': 'com.amap.api.v2.apikey',
          'android:value': apiKey
        }
      });
    }
    
    return config;
  });

  // 2. 淇敼 project build.gradle 娣诲姞楂樺痉浠撳簱
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('amap')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{/,
        `allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/google' }
    }`
      );
    }
    return config;
  });

  // 3. 淇敼 app build.gradle 娣诲姞楂樺痉渚濊禆
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('amap-location')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'com.amap.api:location:latest.integration'`
      );
    }
    return config;
  });

  return config;
};

module.exports = withAmapLocation;
