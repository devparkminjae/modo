import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Avatar, AppIcon, ScreenTitle, palette } from '@/components/MessengerUI';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const {profile,user,refreshProfile}=useAuth(); const [editing,setEditing]=useState(false); const [displayName,setDisplayName]=useState(profile?.display_name||''); const [status,setStatus]=useState(profile?.status_message||''); const [phoneSearchEnabled,setPhoneSearchEnabled]=useState(profile?.phone_search_enabled||false); const [notificationsEnabled,setNotificationsEnabled]=useState(true); const [blocked,setBlocked]=useState<{id:string;name:string}[]>([]); const [friends,setFriends]=useState<{id:string;name:string}[]>([]); const [error,setError]=useState('');
  useEffect(()=>{setDisplayName(profile?.display_name||'');setStatus(profile?.status_message||'');setPhoneSearchEnabled(profile?.phone_search_enabled||false)},[profile?.id,profile?.display_name,profile?.status_message,profile?.phone_search_enabled]);
  useEffect(()=>{try{setNotificationsEnabled(localStorage.getItem('modo.notifications')!=='off')}catch{}},[]);
  const loadBlocked=async()=>{if(!supabase||!profile)return;const {data}=await supabase.from('friendships').select('requester_id,addressee_id').eq('status','blocked').or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);const ids=(data||[]).map(x=>x.requester_id===profile.id?x.addressee_id:x.requester_id);if(ids.length){const {data:rows}=await supabase.from('profiles').select('id,display_name').in('id',ids);setBlocked((rows||[]).map(row=>({id:row.id,name:row.display_name})))}else setBlocked([])};
  const loadFriends=async()=>{if(!supabase||!profile)return;const {data}=await supabase.from('friendships').select('requester_id,addressee_id').eq('status','accepted').or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);const ids=(data||[]).map(x=>x.requester_id===profile.id?x.addressee_id:x.requester_id);if(ids.length){const {data:rows}=await supabase.from('profiles').select('id,display_name').in('id',ids);setFriends((rows||[]).map(row=>({id:row.id,name:row.display_name})))}else setFriends([])};
  useEffect(()=>{void loadBlocked();void loadFriends()},[profile?.id]);
  const save=async()=>{if(!supabase||!profile)return;setError('');const clean=displayName.trim();if(!clean)return setError('이름을 입력해 주세요.');const {error:e}=await supabase.from('profiles').update({display_name:clean,status_message:status.trim()}).eq('id',profile.id);if(e)setError(e.message);else{await refreshProfile();setEditing(false)}};
  const togglePhone=async(value:boolean)=>{if(!supabase||!profile)return;setPhoneSearchEnabled(value);const {error:e}=await supabase.from('profiles').update({phone_search_enabled:value}).eq('id',profile.id);if(e){setPhoneSearchEnabled(!value);setError(e.message)}};
  const unblock=async(id:string)=>{const {error:e}=await supabase?.rpc('remove_friend',{target_user_id:id})||{};if(e)setError(e.message);else void loadBlocked()};
  const removeFriend=async(id:string)=>{const {error:e}=await supabase?.rpc('remove_friend',{target_user_id:id})||{};if(e)setError(e.message);else void loadFriends()};

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
          <Text style={styles.accountId}>{user?.email||user?.phone||''}</Text>
        </View>

        <SettingsSection title="계정">
          {editing?<View style={{paddingVertical:12,gap:8}}><TextInput value={displayName} onChangeText={setDisplayName} placeholder="이름" style={styles.editInput}/><TextInput value={status} onChangeText={setStatus} placeholder="상태 메시지" style={styles.editInput}/><Pressable onPress={save}><Text style={styles.settingTitle}>저장</Text></Pressable></View>:<Pressable onPress={()=>{setDisplayName(profile?.display_name||'');setStatus(profile?.status_message||'');setEditing(true)}}><SettingsRow title="내 프로필 편집" detail="이름, 상태 메시지" /></Pressable>}
          <SettingsRow title="로그인 이메일" detail={user?.email||'연결된 이메일 없음'} />
          <SettingsRow title="전화번호" detail={user?.phone||'전화번호 미등록'} />
          <SettingsRow title="사용자 아이디" detail={`@${profile?.username||''}`} />
        </SettingsSection>

        <SettingsSection title="친구">
          <Pressable onPress={()=>router.push('/(tabs)')}><SettingsRow title="친구 추가" detail="아이디 또는 전화번호로 찾기" /></Pressable>
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
          <View style={styles.blockedHeading}><Text style={styles.settingTitle}>차단 친구 관리</Text><Text style={styles.settingDetail}>{blocked.length}명</Text></View>
          {blocked.map(friend=><View key={friend.id} style={styles.blockedRow}><Text style={styles.settingTitle}>{friend.name}</Text><Pressable onPress={()=>void unblock(friend.id)}><Text style={styles.unblock}>차단 해제</Text></Pressable></View>)}
          {blocked.length===0&&<Text style={styles.empty}>차단한 친구가 없습니다.</Text>}
          <View style={styles.blockedHeading}><Text style={styles.settingTitle}>친구 삭제</Text></View>
          {friends.map(friend=><View key={friend.id} style={styles.blockedRow}><Text style={styles.settingTitle}>{friend.name}</Text><Pressable onPress={()=>void removeFriend(friend.id)}><Text style={styles.unblock}>삭제</Text></Pressable></View>)}
          {friends.length===0&&<Text style={styles.empty}>삭제할 친구가 없습니다.</Text>}
        </SettingsSection>

        {error!==''&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable style={{paddingVertical:20}} onPress={async()=>{const {error:e}=await supabase?.auth.signOut()||{};if(e)setError(e.message)}}><Text style={{color:palette.danger,fontSize:15}}>로그아웃</Text></Pressable>

        <SettingsSection title="알림">
          <View style={styles.settingRow}>
            <View style={styles.settingText}><Text style={styles.settingTitle}>웹 메시지 알림</Text><Text style={styles.settingDetail}>앱이 열린 동안 새 메시지를 알려드려요.</Text></View>
            <Switch
              accessibilityLabel="메시지 알림"
              value={notificationsEnabled}
              onValueChange={async value=>{let enabled=value;if(value&&typeof Notification!=='undefined'){if(Notification.permission==='default')await Notification.requestPermission();enabled=Notification.permission==='granted';if(!enabled)setError('브라우저 알림 권한을 허용해 주세요.')}setNotificationsEnabled(enabled);try{localStorage.setItem('modo.notifications',enabled?'on':'off')}catch{}}}
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
  blockedHeading:{paddingVertical:12,gap:4},blockedRow:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:palette.line},unblock:{color:palette.muted,fontSize:13},empty:{paddingVertical:10,color:palette.muted,fontSize:13},error:{padding:10,color:palette.danger,fontSize:13},
});
