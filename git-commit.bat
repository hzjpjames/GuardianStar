@echo off
set PATH=%PATH%;C:\Program Files\Git\bin
cd /d C:\Users\Administrator\.qclaw\workspace-agent-e87418f0\GuardianNew
git add app.json config-plugins/withCleartextTraffic.js android/app/src/main/res/xml/network_security_config.xml
git commit -m "fix: custom plugin for usesCleartextTraffic + network_security_config
- expo-build-properties not working on SDK 55
- replaced with custom withCleartextTraffic plugin
- generates network_security_config.xml automatically"
