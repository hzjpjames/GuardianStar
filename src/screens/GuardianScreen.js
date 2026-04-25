// src/screens/GuardianScreen.js - 瀹堟姢绔晫闈?import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  FlatList, TextInput, Modal, ScrollView, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  getTrackedLocation,
  getLocationHistory,
  getGuardianBindings,
  createGuardianBinding,
  removeGuardianBinding
} from '../services/guardianService';

const { width: SCREEN_W } = Dimensions.get('window');

// OpenStreetMap + Leaflet锛屼娇鐢ㄩ珮寰风摝鐗囷紙鍥藉唴蹇€燂級
const getMapHtml = (lat, lng, name, live = false) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;overflow:hidden}
${live ? `@keyframes pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}} .pulse-ring{animation:pulse 1.5s ease-out infinite}` : ''}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false });
  // 楂樺痉鐡︾墖锛圙CJ-02鍧愭爣绯伙紝涓庢墜鏈篏PS鍧愭爣涓€鑷达級
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    maxZoom: 18,
    subdomains: ['1','2','3','4']
  }).addTo(map);
  map.setView([${lat}, ${lng}], ${live ? 17 : 16});
  var pinHtml = ${live ? `'<div style="position:relative"><div class="pulse-ring" style="position:absolute;top:-12px;left:-12px;width:24px;height:24px;border-radius:50%;background:rgba(33,150,243,0.3)"></div><div style="background:#2196F3;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div></div>'` : `'<div style="background:#2196F3;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>'`};
  var icon = L.divIcon({
    className: '',
    html: pinHtml,
    iconSize: [${live ? 24 : 32}, ${live ? 24 : 32}],
    iconAnchor: [${live ? 12 : 16}, ${live ? 12 : 32}]
  });
  L.marker([${lat}, ${lng}], { icon: icon })
    .addTo(map)
    .bindPopup('<b>${name}</b>');
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.attribution({ position: 'bottomleft', prefix: '' })
    .addAttribution('&copy; 楂樺痉鍦板浘')
    .addTo(map);
</script>
</body>
</html>`;

// 杞ㄨ抗鍥炴斁鍦板浘 HTML
const getHistoryMapHtml = (points, playIdx, name) => {
  // 杩囨护鏈夋晥鍧愭爣鐐?  const validPts = points.filter(p => p.latitude && p.longitude);
  if (validPts.length === 0) return '<html><body style="display:flex;align-items:center;justify-content:center;height:100%;color:#999">鏆傛棤鏈夋晥杞ㄨ抗</body></html>';

  const jsonPts = JSON.stringify(validPts.map(p => ({
    lat: p.latitude, lng: p.longitude,
    time: p.timestamp ? new Date(p.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''
  })));

  // 鎾斁绱㈠紩锛?1 琛ㄧず鏄剧ず鍏ㄩ儴杞ㄨ抗
  const showIdx = playIdx < 0 ? validPts.length - 1 : Math.min(playIdx, validPts.length - 1);

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;overflow:hidden}
#info{position:absolute;top:10px;left:10px;right:10px;z-index:999;background:rgba(255,255,255,0.92);border-radius:10px;padding:10px 14px;font-size:13px;color:#333;box-shadow:0 1px 4px rgba(0,0,0,.15)}
#info b{color:#2196F3}</style>
</head>
<body>
<div id="map"></div>
<div id="info">杞ㄨ抗鍔犺浇涓?..</div>
<script>
  var pts = ${jsonPts};
  var showIdx = ${showIdx};
  var map = L.map('map', { zoomControl: false, attributionControl: false });
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    maxZoom: 18, subdomains: ['1','2','3','4']
  }).addTo(map);

  // 璧风粓鐐瑰浘鏍?  var startIcon = L.divIcon({ className: '', html: '<div style="background:#4CAF50;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>', iconSize: [24,24], iconAnchor: [12,12] });
  var endIcon = L.divIcon({ className: '', html: '<div style="background:#f44336;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>', iconSize: [24,24], iconAnchor: [12,12] });
  var moveIcon = L.divIcon({ className: '', html: '<div style="background:#2196F3;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>', iconSize: [20,20], iconAnchor: [10,10] });

  // 鐢诲畬鏁磋建杩圭嚎
  var lineCoords = pts.map(function(p) { return [p.lat, p.lng]; });
  var polyline = L.polyline(lineCoords, { color: '#2196F3', weight: 4, opacity: 0.4 });
  polyline.addTo(map);

  // 璧风偣鏍囪
  L.marker([pts[0].lat, pts[0].lng], { icon: startIcon }).addTo(map).bindPopup('璧风偣');
  // 缁堢偣鏍囪
  var lastPt = pts[pts.length - 1];
  L.marker([lastPt.lat, lastPt.lng], { icon: endIcon }).addTo(map).bindPopup('缁堢偣');

  // 褰撳墠鍥炴斁浣嶇疆鏍囪
  var curPt = pts[showIdx];
  var curMarker = L.marker([curPt.lat, curPt.lng], { icon: moveIcon }).addTo(map);

  // 鑷€傚簲瑙嗛噹
  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

  // 淇℃伅闈㈡澘
  var info = document.getElementById('info');
  info.innerHTML = '<b>${name}</b> 杞ㄨ抗鍥炴斁 (' + pts.length + ' 涓偣)<br>褰撳墠: ' + (curPt.time || '') + ' | ' + curPt.lat.toFixed(6) + ', ' + curPt.lng.toFixed(6);
</script>
</body>
</html>`;
};

const GuardianScreen = ({ userId, onLogout }) => {
  const [bindings, setBindings] = useState([]);
  const [selectedBinding, setSelectedBinding] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [trackedUid, setTrackedUid] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [liveTracking, setLiveTracking] = useState(false); // 瀹炴椂璺熻釜妯″紡

  useEffect(() => {
    loadBindings();
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const loadBindings = async () => {
    try {
      const data = await getGuardianBindings(userId);
      setBindings(data);
    } catch (e) {
      console.error('鍔犺浇缁戝畾澶辫触:', e);
    }
  };

  const selectBinding = async (binding) => {
    setSelectedBinding(binding);
    setShowHistory(false);
    setLiveTracking(false);
    if (refreshTimer) clearInterval(refreshTimer);
    await refreshLocation(binding.trackedUid);
    const timer = setInterval(() => refreshLocation(binding.trackedUid), 30000);
    setRefreshTimer(timer);
  };

  const refreshLocation = async (uid) => {
    setLoading(true);
    try {
      const loc = await getTrackedLocation(uid);
      if (loc) {
        setCurrentLocation(loc);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('鑾峰彇浣嶇疆澶辫触:', e);
    }
    setLoading(false);
  };

  const toggleLiveTracking = () => {
    if (!selectedBinding) return;
    if (liveTracking) {
      // 鍏抽棴瀹炴椂璺熻釜锛屾仮澶?0绉掑埛鏂?      setLiveTracking(false);
      if (refreshTimer) clearInterval(refreshTimer);
      const timer = setInterval(() => refreshLocation(selectedBinding.trackedUid), 30000);
      setRefreshTimer(timer);
    } else {
      // 寮€鍚疄鏃惰窡韪紝10绉掑埛鏂?      setLiveTracking(true);
      if (refreshTimer) clearInterval(refreshTimer);
      const timer = setInterval(() => refreshLocation(selectedBinding.trackedUid), 10000);
      setRefreshTimer(timer);
    }
  };

  const handleAddBinding = async () => {
    if (!trackedUid.trim()) {
      Alert.alert('鎻愮ず', '璇疯緭鍏ヨ瀹堟姢鐨勭敤鎴稩D');
      return;
    }
    try {
      await createGuardianBinding(userId, trackedUid.trim(), nickname.trim() || trackedUid);
      setShowAddModal(false);
      setTrackedUid('');
      setNickname('');
      loadBindings();
      Alert.alert('鎴愬姛', '缁戝畾宸插垱寤?);
    } catch (e) {
      Alert.alert('閿欒', '缁戝畾澶辫触: ' + e.message);
    }
  };

  const handleRemoveBinding = (binding) => {
    Alert.alert('纭', `纭畾瑙ｉ櫎涓?"${binding.nickname}" 鐨勭粦瀹氾紵`, [
      { text: '鍙栨秷', style: 'cancel' },
      {
        text: '瑙ｉ櫎',
        style: 'destructive',
        onPress: async () => {
          await removeGuardianBinding(binding.id);
          if (selectedBinding?.id === binding.id) {
            setSelectedBinding(null);
            setCurrentLocation(null);
            setHistory([]);
            if (refreshTimer) clearInterval(refreshTimer);
          }
          loadBindings();
        }
      }
    ]);
  };

  const handleShowHistory = async () => {
    if (!selectedBinding) return;
    try {
      const data = await getLocationHistory(selectedBinding.trackedUid, 24);
      setHistory(data);
      setShowHistory(true);
    } catch (e) {
      Alert.alert('閿欒', '鑾峰彇杞ㄨ抗澶辫触');
    }
  };

  const formatTime = (date) => {
    if (!date) return '--';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const renderBindingItem = ({ item }) => {
    const isSelected = selectedBinding?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.bindingChip, isSelected && styles.bindingChipSelected]}
        onPress={() => selectBinding(item)}
        onLongPress={() => handleRemoveBinding(item)}
      >
        <Text style={[styles.bindingChipText, isSelected && styles.bindingChipTextSelected]}>
          {item.nickname}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout} style={styles.backBtn}>
          <Text style={styles.backBtnText}>鈫?杩斿洖</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>瀹堟姢绔?/Text>
          <Text style={styles.headerSubtitle}>ID: {userId}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ 娣诲姞</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bindingsArea}>
        <Text style={styles.sectionLabel}>瀹堟姢瀵硅薄</Text>
        <View style={styles.bindingsRow}>
          <FlatList
            data={bindings}
            renderItem={renderBindingItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>鏆傛棤瀹堟姢瀵硅薄锛岀偣鍑诲彸涓婅娣诲姞</Text>
            }
          />
        </View>
      </View>

      <ScrollView style={styles.mainArea} contentContainerStyle={styles.mainAreaContent}>
        {selectedBinding ? (
          <>
            {/* 鍦板浘 - 楂樺痉 WebView */}
            <View style={styles.mapContainer}>
              {currentLocation ? (
                <>
                  <WebView
                    style={styles.map}
                    originWhitelist={['*']}
                    source={{ html: getMapHtml(currentLocation.latitude, currentLocation.longitude, selectedBinding.nickname, liveTracking) }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onMessage={(event) => {}}
                  />
                  {/* 搴曢儴淇℃伅鏍?*/}
                  <View style={styles.mapBottomBar}>
                    <Text style={styles.mapBottomText}>
                      閫熷害: {currentLocation.speed != null && currentLocation.speed >= 0 ? (currentLocation.speed * 3.6).toFixed(1) : 0} km/h
                    </Text>
                    <Text style={styles.mapBottomText}>
                      {formatTime(lastUpdate)}
                    </Text>
                    <TouchableOpacity onPress={() => refreshLocation(selectedBinding.trackedUid)}>
                      <Text style={styles.mapRefreshBtn}>{loading ? '鍒锋柊涓?..' : '馃攧 鍒锋柊'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.noLocationBox}>
                  <Text style={styles.noLocationText}>鏆傛棤浣嶇疆鏁版嵁锛岃鍏堣瀵规柟寮€鍚畾浣?/Text>
                </View>
              )}
            </View>

            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, liveTracking && styles.actionBtnActive]}
                onPress={toggleLiveTracking}
              >
                <Text style={[styles.actionBtnText, liveTracking && styles.actionBtnTextActive]}>
                  {liveTracking ? '馃洃 鍋滄璺熻釜' : '馃摗 瀹炴椂璺熻釜'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShowHistory}>
                <Text style={styles.actionBtnText}>馃搳 鏌ョ湅杞ㄨ抗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => refreshLocation(selectedBinding.trackedUid)}>
                <Text style={styles.actionBtnText}>馃攧 鍒锋柊</Text>
              </TouchableOpacity>
            </View>

            {showHistory && history.length > 0 && (
              <View style={styles.historyMapContainer}>
                <WebView
                  style={styles.historyMap}
                  originWhitelist={['*']}
                  source={{ html: getHistoryMapHtml(history, playingIdx, selectedBinding.nickname) }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
                {/* 鎾斁鎺у埗鏉?*/}
                <View style={styles.playbackBar}>
                  <Text style={styles.playbackInfo}>
                    {playingIdx < 0 ? `鍏?${history.length} 涓偣` : `${playingIdx + 1}/${history.length}`}
                  </Text>
                  <View style={styles.playbackBtns}>
                    <TouchableOpacity style={styles.playBtn} onPress={() => setPlayingIdx(0)}>
                      <Text style={styles.playBtnText}>鈴?/Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.playBtn} onPress={() => setPlayingIdx(-1)}>
                      <Text style={styles.playBtnText}>鈴?鍏ㄦ櫙</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={() => {
                        const next = playingIdx < 0 ? 0 : Math.min(playingIdx + 1, history.length - 1);
                        setPlayingIdx(next);
                      }}
                    >
                      <Text style={styles.playBtnText}>鈻垛柖</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.closeHistoryBtn} onPress={() => { setShowHistory(false); setPlayingIdx(-1); }}>
                    <Text style={styles.closeHistoryBtnText}>鉁?鍏抽棴</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {showHistory && history.length === 0 && (
              <View style={styles.historyCard}>
                <Text style={styles.noLocationText}>鏆傛棤杞ㄨ抗璁板綍</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noBindingArea}>
            <Text style={styles.noBindingEmoji}>馃洝锔?/Text>
            <Text style={styles.noBindingText}>閫夋嫨涓€涓畧鎶ゅ璞?/Text>
            <Text style={styles.noBindingHint}>鎴栧湪鍙充笂瑙掓坊鍔犳柊鐨勫畧鎶ゅ璞?/Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>娣诲姞瀹堟姢瀵硅薄</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="鐢ㄦ埛ID"
              value={trackedUid}
              onChangeText={setTrackedUid}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="鏄电О锛堝彲閫夛級"
              value={nickname}
              onChangeText={setNickname}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowAddModal(false); setTrackedUid(''); setNickname(''); }}
              >
                <Text style={styles.modalBtnCancelText}>鍙栨秷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOk]}
                onPress={handleAddBinding}
              >
                <Text style={styles.modalBtnOkText}>娣诲姞</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bindingsArea: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  bindingsRow: {
    minHeight: 40,
  },
  bindingChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 20,
    marginRight: 8,
  },
  bindingChipSelected: {
    backgroundColor: '#2196F3',
  },
  bindingChipText: {
    color: '#333',
    fontWeight: '500',
  },
  bindingChipTextSelected: {
    color: '#fff',
  },
  emptyText: {
    color: '#bbb',
    fontSize: 14,
    alignSelf: 'center',
    paddingVertical: 8,
  },
  mainArea: {
    flex: 1,
  },
  mainAreaContent: {
    padding: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  coordBig: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  coordBigLabel: {
    fontSize: 14,
    color: '#888',
    width: 50,
  },
  coordBigValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'monospace',
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshBtn: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    color: '#888',
    fontSize: 15,
  },
  infoValue: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  noLocationText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#e8e8e8',
  },
  map: {
    flex: 1,
  },
  mapBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 16,
  },
  mapBottomText: {
    fontSize: 13,
    color: '#555',
  },
  mapRefreshBtn: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  noLocationBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionBtnActive: {
    backgroundColor: '#2196F3',
  },
  actionBtnTextActive: {
    color: '#fff',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyMapContainer: {
    height: 350,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#e8e8e8',
  },
  historyMap: {
    flex: 1,
  },
  playbackBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  playbackInfo: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  playbackBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  playBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  playBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeHistoryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  closeHistoryBtnText: {
    color: '#999',
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historyTime: {
    color: '#888',
    fontSize: 14,
  },
  historyCoords: {
    color: '#333',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  noBindingArea: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noBindingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noBindingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  noBindingHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalBtnCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalBtnOk: {
    backgroundColor: '#2196F3',
  },
  modalBtnOkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  backBtnText: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GuardianScreen;
