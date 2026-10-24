import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { AppIcon, palette } from '@/components/MessengerUI';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: '#898F8D',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 78 : 68,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? 18 : 7,
          backgroundColor: palette.page,
          borderTopColor: palette.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '친구',
          tabBarIcon: ({ color }) => <AppIcon name="friends" color={color} size={23} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '채팅',
          tabBarIcon: ({ color }) => <AppIcon name="chats" color={color} size={23} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <AppIcon name="settings" color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  tabIcon: { marginTop: 1 },
});
