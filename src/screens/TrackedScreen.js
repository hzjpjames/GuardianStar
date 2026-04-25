// src/screens/TrackedScreen.js - 瀹氫綅绔晫闈?// v6.0 - 浣跨敤 expo-location锛堝師鐢?GPS锛? IP 瀹氫綅闄嶇骇
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { 
  getCurrentLocation, 
  getSystemGps, 
  ipLocate, 
  reportLocation, 
  startBackgroundGps, 
  stopBackgroundGps 
} from '../services/locationService';

const TrackedScreen = ({ userId, onLogout }) => {
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastReport, setLastReport] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [mockStep, setMockStep] = useState(0);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualLat, setManualLat] = useState('30.42751');
  const [manualLng, setManualLng] = useState('120.29496');
  const [useManual, setUseManual] = useState(false);
  const [locSource, setLocSource] = useState(null); // 'GPS' | 'IP瀹氫綅' | '妯℃嫙' | '鎵嬪姩'
  const [debugLog, setDebugLog] = useState([]); // 璋冭瘯鏃ュ織
  const [gpsStatus, setGpsStatus] = useState('鏈祴璇?); // GPS鐘舵€?
  const trackingRef = useRef(false);

  // 璋冭瘯鏃ュ織
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `[${time}] ${msg}`]);
    console.log('[GPS璋冭瘯]', msg);
  };

  // 妯℃嫙杞ㄨ抗璺嚎锛氭澀宸炲競鍖?  const mockRoute = [
    { lat: 30.42751, lng: 120.29496 },
    { lat: 30.42500, lng: 120.29200 },
    { lat: 30.42200, lng: 120.29000 },
    { lat: 30.41800, lng: 120.28500 },
    { lat: 30.41300, lng: 120.27800 },
    { lat: 30.40700, lng: 120.26800 },
    { lat: 30.40200, lng: 120.25800 },
    { lat: 30.39500, lng: 120.24800 },
    { lat: 30.38800, lng: 120.24000 },
  ];

  const getMockLocation = () => {
    const idx = mockStep % (mockRoute.length - 1);
    const next = idx + 1;
    const lat = mockRoute[idx].lat + (mockRoute[next].lat - mockRoute[idx].lat) * 0.5 + (Math.random() - 0.5) * 0.0002;
    const lng = mockRoute[idx].lng + (mockRoute[next].lng - mockRoute[idx].lng) * 0.5 + (Math.random() - 0.5) * 0.0002;
    return { latitude: lat, longitude: lng, accuracy: 20 + Math.random() * 10, altitude: 10 + Math.random() * 5, speed: 1 + Math.random() * 2, timestamp: Date.now() };
  };

  useEffect(() => {
    return () => { stopTracking(); };
  }, []);

  // 鈹€鈹€ 鎵嬪姩杈撳叆鍧愭爣涓婃姤 鈹€鈹€
  const startManualTracking = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('鍧愭爣鏍煎紡閿欒', '璇疯緭鍏ユ湁鏁堢殑缁忕含搴?);
      return;
    }
    setManualModalVisible(false);
    setLoading(true);
    setUseManual(true);
    const location = { latitude: lat, longitude: lng, accuracy: 50, altitude: 0, speed: 0, timestamp: Date.now(), source: '鎵嬪姩' };
    setCurrentLocation(location);
    setLocSource('鎵嬪姩');
    await reportLocation(userId, location);
    setLastReport(new Date());
    setTracking(true);
    const id = setInterval(async () => {
      await reportLocation(userId, location);
      setLastReport(new Date());
    }, 30000);
    setIntervalId(id);
    setLoading(false);
  };

  // 鈹€鈹€ 娴嬭瘯鍘熺敓 GPS锛堣皟璇曠敤锛?鈹€鈹€
  const testSystemGps = async () => {
    addLog('娴嬭瘯 expo-location GPS...');
    setGpsStatus('馃攧 GPS璇锋眰涓?..');
    try {
      const loc = await getSystemGps(20000);
      addLog(`GPS鎴愬姛: ${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)} 卤${loc.accuracy.toFixed(0)}m`);
      setGpsStatus(`鉁?GPS鎴愬姛 卤${loc.accuracy.toFixed(0)}m`);
    } catch (e) {
      addLog(`GPS澶辫触: ${e.message}`);
      setGpsStatus(`鉂?${e.message}`);
    }
  };

  // 鈹€鈹€ 寮€鍚畾浣?鈹€鈹€
  const startTracking = async () => {
    if (loading) return;
    setLoading(true);
    addLog('寮€鍚畾浣?..');

    try {
      let location;

      if (useManual) {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        location = { latitude: lat, longitude: lng, accuracy: 50, altitude: 0, speed: 0, timestamp: Date.now(), source: '鎵嬪姩' };
        addLog('浣跨敤鎵嬪姩鍧愭爣');
      } else if (useMock) {
        location = { ...getMockLocation(), source: '妯℃嫙' };
        addLog('浣跨敤妯℃嫙鍧愭爣');
      } else {
        // 浣跨敤 expo-location锛圙PS浼樺厛锛岃嚜鍔ㄩ檷绾P锛?        addLog('灏濊瘯鑾峰彇浣嶇疆...');
        location = await getCurrentLocation();
        addLog(`${location.source}: ${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`);
      }

      setCurrentLocation(location);
      setLocSource(location.source);
      
      if (!trackingRef.current) {
        await reportLocation(userId, location);
        setLastReport(new Date());
      }

      setTracking(true);
      trackingRef.current = true;

      // 瀹氭湡鏇存柊
      const id = setInterval(async () => {
        try {
          let loc;
          if (useManual) {
            const lat = parseFloat(manualLat);
            const lng = parseFloat(manualLng);
            loc = { latitude: lat, longitude: lng, accuracy: 50, altitude: 0, speed: 0, timestamp: Date.now(), source: '鎵嬪姩' };
          } else if (useMock) {
            setMockStep(s => s + 1);
            loc = { ...getMockLocation(), source: '妯℃嫙' };
          } else {
            loc = await getCurrentLocation();
          }
          setCurrentLocation(loc);
          setLocSource(loc.source);
          await reportLocation(userId, loc);
          setLastReport(new Date());
          addLog(`鏇存柊: ${loc.source} ${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`);
        } catch (e) {
          addLog('鏇存柊澶辫触: ' + e.message);
        }
      }, 30000);
      setIntervalId(id);

    } catch (e) {
      addLog('瀹氫綅澶辫触: ' + e.message);
      Alert.alert('瀹氫綅澶辫触', e.message);
    }

    setLoading(false);
  };

  const stopTracking = () => {
    if (intervalId) { clearInterval(intervalId); setIntervalId(null); }
    stopBackgroundGps();
    setTracking(false);
    trackingRef.current = false;
    setUseManual(false);
  };

  const formatTime = (date) => {
    if (!date) return '--';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout} style={styles.backBtn}>
          <Text style={styles.backBtnText}>鈫?杩斿洖</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>瀹氫綅绔?/Text>
        <Text style={styles.userId}>ID: {userId}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>馃搷 褰撳墠浣嶇疆</Text>
          {locSource && (
            <View style={[
              styles.sourceBadge,
              locSource === 'GPS' && styles.sourceGps,
              locSource === 'IP瀹氫綅' && styles.sourceIp,
              locSource === '妯℃嫙' && styles.sourceMock,
              locSource === '鎵嬪姩' && styles.sourceManual,
            ]}>
              <Text style={styles.sourceBadgeText}>
                {locSource === 'GPS' ? '馃洶 GPS' : locSource === 'IP瀹氫綅' ? '馃摱 IP瀹氫綅' : locSource === '鎵嬪姩' ? '馃搷 鎵嬪姩' : '馃敡 妯℃嫙'}
              </Text>
            </View>
          )}
        </View>
        {currentLocation ? (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>绾害:</Text>
              <Text style={styles.infoValue}>{currentLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>缁忓害:</Text>
              <Text style={styles.infoValue}>{currentLocation.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>绮惧害:</Text>
              <Text style={styles.infoValue}>{currentLocation.accuracy ? `卤${currentLocation.accuracy.toFixed(0)}m` : '鏈煡'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>閫熷害:</Text>
              <Text style={styles.infoValue}>
                {currentLocation.speed != null && currentLocation.speed >= 0
                  ? (currentLocation.speed * 3.6).toFixed(1) + ' km/h'
                  : '闈欐'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.loadingText}>姝ｅ湪鑾峰彇浣嶇疆...</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, tracking ? styles.statusOnline : styles.statusOffline]} />
          <Text style={[styles.statusText, tracking ? styles.statusOnlineText : styles.statusOfflineText]}>
            {tracking ? '瀹氫綅涓? : '宸插仠姝?}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>涓婃涓婃姤:</Text>
          <Text style={styles.infoValue}>{formatTime(lastReport)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>闂撮殧:</Text>
          <Text style={styles.infoValue}>30 绉?/Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.trackBtn, tracking && styles.trackBtnStop]}
        onPress={tracking ? stopTracking : startTracking}
        disabled={loading}
      >
        <Text style={styles.trackBtnText}>
          {loading ? '鈴?澶勭悊涓?..' : tracking ? '鈴?鍋滄瀹氫綅' : '鈻?寮€鍚畾浣?}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mockBtn, useMock && styles.mockBtnActive]}
        onPress={() => setUseMock(!useMock)}
      >
        <Text style={[styles.mockBtnText, useMock && styles.mockBtnTextActive]}>
          {useMock ? '馃敡 妯℃嫙妯″紡宸插紑鍚紙鏉窞璺嚎锛? : '馃敡 浣跨敤妯℃嫙鍧愭爣锛堟祴璇曠敤锛?}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mockBtn, useManual && styles.mockBtnActive]}
        onPress={() => { if (!tracking) setManualModalVisible(true); }}
      >
        <Text style={[styles.mockBtnText, useManual && styles.mockBtnTextActive]}>
          {useManual ? `馃搷 鎵嬪姩妯″紡: ${manualLat}, ${manualLng}` : '馃搷 鎵嬪姩杈撳叆鍧愭爣'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        馃挕 寮€鍚畾浣嶅悗锛孖P蹇€熷畾浣?+ GPS鑷姩鏍″噯
      </Text>

      {/* GPS 璋冭瘯闈㈡澘 */}
      <View style={styles.debugCard}>
        <Text style={styles.debugTitle}>馃敡 GPS 璋冭瘯</Text>
        <View style={styles.debugStatusRow}>
          <Text style={styles.debugLabel}>鐘舵€?</Text>
          <Text style={styles.debugValue}>{gpsStatus}</Text>
        </View>
        <TouchableOpacity
          style={styles.debugBtn}
          onPress={testSystemGps}
        >
          <Text style={styles.debugBtnText}>馃И 鍗曠嫭娴嬭瘯 GPS (expo-location)</Text>
        </TouchableOpacity>
        <View style={styles.debugLogBox}>
          {debugLog.length === 0 ? (
            <Text style={styles.debugLogEmpty}>鏆傛棤鏃ュ織</Text>
          ) : (
            debugLog.map((log, i) => (
              <Text key={i} style={styles.debugLogText}>{log}</Text>
            ))
          )}
        </View>
      </View>

      {/* 鎵嬪姩杈撳叆鍧愭爣寮圭獥 */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>馃搷 鎵嬪姩杈撳叆鍧愭爣</Text>
            <Text style={styles.modalSubtitle}>鍏抽棴瀹氫綅鏈嶅姟鏃讹紝鍙墜鍔ㄨ緭鍏ョ粡绾害鐩存帴涓婃姤</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="绾害锛屽 30.42751"
              keyboardType="numeric"
              value={manualLat}
              onChangeText={setManualLat}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="缁忓害锛屽 120.29496"
              keyboardType="numeric"
              value={manualLng}
              onChangeText={setManualLng}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setManualModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>鍙栨秷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={startManualTracking}>
                <Text style={styles.modalBtnConfirmText}>寮€濮嬪畾浣?/Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50' },
  userId: { fontSize: 14, color: '#666', backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sourceBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 10 },
  sourceGps: { backgroundColor: '#e3f2fd' },
  sourceIp: { backgroundColor: '#e8f5e9' },
  sourceMock: { backgroundColor: '#fff3e0' },
  sourceManual: { backgroundColor: '#f3e5f5' },
  sourceBadgeText: { fontSize: 13, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { color: '#888', fontSize: 15 },
  infoValue: { color: '#333', fontSize: 15, fontWeight: '500' },
  loadingText: { color: '#999', textAlign: 'center', paddingVertical: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusOnline: { backgroundColor: '#4CAF50' },
  statusOffline: { backgroundColor: '#e0e0e0' },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  statusOnlineText: { color: '#4CAF50' },
  statusOfflineText: { color: '#999' },
  trackBtn: { padding: 18, backgroundColor: '#4CAF50', borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  trackBtnStop: { backgroundColor: '#f44336', shadowColor: '#f44336' },
  trackBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  mockBtn: { padding: 14, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd', marginBottom: 16 },
  mockBtnActive: { backgroundColor: '#fff8e1', borderColor: '#FF9800' },
  mockBtnText: { color: '#666', fontSize: 14 },
  mockBtnTextActive: { color: '#E65100', fontWeight: '600' },
  hint: { color: '#999', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  backBtnText: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#999', marginBottom: 16, lineHeight: 18 },
  modalInput: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 12, backgroundColor: '#fafafa' },
  modalBtns: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f5f5f5', marginRight: 8 },
  modalBtnConfirm: { backgroundColor: '#4CAF50', marginLeft: 8 },
  modalBtnCancelText: { color: '#666', fontSize: 16, fontWeight: '600' },
  modalBtnConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  debugCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#ff9800', borderStyle: 'dashed' },
  debugTitle: { fontSize: 16, fontWeight: 'bold', color: '#ff9800', marginBottom: 12 },
  debugStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  debugLabel: { color: '#666', fontSize: 14, marginRight: 8 },
  debugValue: { color: '#333', fontSize: 14, fontWeight: '600', flex: 1 },
  debugBtn: { padding: 12, backgroundColor: '#ff9800', borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  debugBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  debugLogBox: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, minHeight: 80, maxHeight: 150 },
  debugLogEmpty: { color: '#999', fontSize: 12, textAlign: 'center' },
  debugLogText: { color: '#333', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
});

export default TrackedScreen;