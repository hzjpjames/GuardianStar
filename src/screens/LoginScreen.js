// src/screens/LoginScreen.js - 鐧诲綍鐣岄潰
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const LoginScreen = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('tracked');

  const handleLogin = () => {
    if (!userId.trim()) {
      Alert.alert('鎻愮ず', '璇疯緭鍏ョ敤鎴稩D');
      return;
    }
    onLogin({ userId: userId.trim(), nickname: nickname.trim() || userId, role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>瀹堟姢鏄?/Text>
      <Text style={styles.subtitle}>鎵嬫満瀹氫綅杞欢</Text>

      <TextInput
        style={styles.input}
        placeholder="鐢ㄦ埛ID锛堢敤浜庣粦瀹氾級"
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="鏄电О锛堝彲閫夛級"
        value={nickname}
        onChangeText={setNickname}
      />

      <View style={styles.roleSelector}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'tracked' && styles.roleBtnActive]}
          onPress={() => setRole('tracked')}
        >
          <Text style={[styles.roleText, role === 'tracked' && styles.roleTextActive]}>瀹氫綅绔?/Text>
          <Text style={styles.roleDesc}>琚畧鎶ょ殑鎵嬫満</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'guardian' && styles.roleBtnActive]}
          onPress={() => setRole('guardian')}
        >
          <Text style={[styles.roleText, role === 'guardian' && styles.roleTextActive]}>瀹堟姢绔?/Text>
          <Text style={styles.roleDesc}>鏌ョ湅浣嶇疆鐨勬墜鏈?/Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginBtnText}>杩涘叆</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  roleBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  roleBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  roleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleTextActive: {
    color: '#4CAF50',
  },
  roleDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loginBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;