// App.js - 涓诲叆鍙?import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import TrackedScreen from './src/screens/TrackedScreen';
import GuardianScreen from './src/screens/GuardianScreen';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = ({ userId, nickname, role }) => {
    setUser({ id: userId, nickname, role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {user.role === 'tracked' ? (
        <TrackedScreen userId={user.id} onLogout={handleLogout} />
      ) : (
        <GuardianScreen userId={user.id} onLogout={handleLogout} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});