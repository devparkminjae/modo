import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Avatar, AppIcon, ScreenTitle, palette } from '@/components/MessengerUI';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const [phoneSearchEnabled, setPhoneSearchEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const {profile,refreshProfile}=useAuth(); const [editing,setEditing]=useState(false); const [displayName,setDisplayName]=useState(profile?.display_name||''); const [status,setStatus]=useState(profile?.status_message||'');
  const save=async()=>{if(!supabase||!profile)return;const {error}=await supabase.from('profiles').update({display_name:displayName.trim(),status_message:status.trim()}).eq('id',profile.id);if(error)Alert.alert('저장 실패',error.message);else{await refreshProfile();setEditing(false)}};
  const togglePhone=async(value:boolean)=>{setPhoneSearchEnabled(value);if(supabase&&profile){const {error}=await supabase.from('profiles').update({phone_search_enabled:value}).eq('id',profile.id);if(error){setPhoneSearchEnabled(!value);Alert.alert('저장 실패',error.message)}}};

  return (
    <View style={styles.screen}>
      <ScreenTitle title="설정" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.accountRow}>
          <Avatar label={profile?.display_name||'나'} color="#E7F4EA" size={58} />
          <View style={styles.accountText}>
            <Text style={styles.accountName}>{profile?.display_name||'프로필 미설정'}</Text>
            <Text style={styles.accountId}>@{profile?.username||''}</Text>
          </View>
          <AppIcon name="chevron" color={palette.faint} size={16} />
        </View>

        <SettingsSection title="계정">
          {editing?<View style={{paddingVertical:12,gap:8}}><TextInput value={displayName} onChangeText={setDisplayName} placeholder="이름" style={styles.editInput}/><TextInput value={status} onChangeText={setStatus} placeholder="상태 메시지" style={styles.editInput}/><Pressable onPress={save}><Text style={styles.settingTitle}>저장</Text></Pressable></View>:<Pressable onPress={()=>{setDisplayName(profile?.display_name||'');setStatus(profile?.status_message||'');setEditing(true)}}><SettingsRow title="내 프로필 편집" detail="이름, 상태 메시지" /></Pressable>}
          <SettingsRow title="계정 정보" detail="이메일, 전화번호, 아이디" />
        </SettingsSection>

        <SettingsSection title="친구">
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>전화번호로 친구 찾기 허용</Text>
              <Text style={styles.settingDetail}>내 번호를 아는 사람이 나를 찾을 수 있어요.</Text>
            </View>
            <Switch
              accessibilityLabel="전화번호로 친구 찾기 허용"
              value={profile?.phone_search_enabled??phoneSearchEnabled}
              onValueChange={togglePhone}
              trackColor={{ false: '#D9DDDB', true: '#FEE500' }}
              thumbColor={phoneSearchEnabled ? '#252525' : '#FFFFFF'}
            />
          </View>
          <SettingsRow title="차단 친구 관리" />
        </SettingsSection>

        <Pressable style={{paddingVertical:20}} onPress={async()=>{await supabase?.auth.signOut()}}><Text style={{color:palette.danger,fontSize:15}}>로그아웃</Text></Pressable>

        <SettingsSection title="알림">
          <View style={styles.settingRow}>
            <View style={styles.settingText}><Text style={styles.settingTitle}>메시지 알림</Text></View>
            <Switch
              accessibilityLabel="메시지 알림"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D9DDDB', true: '#FEE500' }}
              thumbColor={notificationsEnabled ? '#252525' : '#FFFFFF'}
            />
          </View>
        </SettingsSection>

        <Text style={styles.version}>모도 · pre v0.0.1</Text>
      </ScrollView>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function SettingsRow({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {detail && <Text style={styles.settingDetail}>{detail}</Text>}
      </View>
      <AppIcon name="chevron" color={palette.faint} size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.page },
  content: { paddingHorizontal: 22, paddingBottom: 28 },
  accountRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  accountText: { flex: 1, gap: 5 },
  accountName: { color: palette.ink, fontSize: 17, fontWeight: '600' },
  accountId: { color: palette.muted, fontSize: 13 },
  section: { paddingTop: 21 },
  sectionTitle: { paddingBottom: 5, color: palette.muted, fontSize: 13, fontWeight: '500' },
  sectionRows: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  settingRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  settingText: { flex: 1, gap: 4, paddingVertical: 11 },
  settingTitle: { color: palette.ink, fontSize: 15 },
  settingDetail: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  version: { paddingTop: 25, color: palette.faint, fontSize: 12 },
  editInput:{backgroundColor:'#F4F5F4',padding:12,borderRadius:8},
});
