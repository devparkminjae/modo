import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

import { Avatar, HeaderAction, ScreenTitle, SearchField, palette } from '@/components/MessengerUI';

type Friend = { id:string; username:string; display_name:string; status_message:string };
type FriendRow = { id:string; name:string; status:string; color:string };

export default function FriendsScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [friends,setFriends]=useState<Friend[]>([]); const [addOpen,setAddOpen]=useState(false); const [lookup,setLookup]=useState(''); const [lookupMode,setLookupMode]=useState<'id'|'phone'>('id'); const [busy,setBusy]=useState(false);const [error,setError]=useState('');const {profile,refreshProfile}=useAuth();
  const load=async()=>{ if(!supabase||!profile)return; const {data,error:e}=await supabase.from('friendships').select('requester_id,addressee_id').eq('status','accepted'); if(e){setError(e.message);return} const ids=(data||[]).flatMap(x=>[x.requester_id,x.addressee_id]).filter(id=>id!==profile.id); if(ids.length){const {data:ps,error:pe}=await supabase.from('profiles').select('id,username,display_name,status_message').in('id',[...new Set(ids)]);if(pe)setError(pe.message);else setFriends(ps||[])}else setFriends([]); };
  useEffect(()=>{void refreshProfile();void load()},[profile?.id]);
  const visibleFriends=useMemo(()=>friends.filter(f=>f.display_name.includes(query)||f.username.includes(query)),[friends,query]);
  const addFriend=async()=>{if(!supabase||!profile||!lookup.trim())return;setBusy(true);setError('');const {data,error:e}=await supabase.rpc('add_friend_by_lookup',{lookup_value:lookup.trim(),lookup_type:lookupMode});if(e||!data)setError(e?.message||'사용자를 찾지 못했습니다.');else{await load();setLookup('');setAddOpen(false)}setBusy(false)};
  const blockFriend=async(id:string)=>{if(!supabase)return;const {error:e}=await supabase.rpc('set_friend_block',{target_user_id:id,should_block:true});if(e)setError(e.message);else{setFriends(prev=>prev.filter(f=>f.id!==id));setError('친구를 차단했습니다. 설정에서 차단을 해제할 수 있습니다.')}};

  return (
    <View style={styles.screen}>
      <ScreenTitle title="친구">
        <HeaderAction label={searchOpen ? '검색 닫기' : '친구 검색'} icon={searchOpen ? 'close' : 'search'} onPress={() => {
          setSearchOpen((open) => !open);
          setQuery('');
        }} />
        <HeaderAction label="친구 추가" icon="addPerson" onPress={() => setAddOpen(v=>!v)} />
      </ScreenTitle>
      {addOpen&&<View style={{marginHorizontal:22,gap:8,marginBottom:8}}><View style={{flexDirection:'row',gap:14}}><Pressable onPress={()=>setLookupMode('id')}><Text style={{fontWeight:lookupMode==='id'?'700':'400',color:lookupMode==='id'?palette.ink:palette.muted}}>아이디</Text></Pressable><Pressable onPress={()=>setLookupMode('phone')}><Text style={{fontWeight:lookupMode==='phone'?'700':'400',color:lookupMode==='phone'?palette.ink:palette.muted}}>전화번호</Text></Pressable></View><View style={{flexDirection:'row',gap:8}}><TextInput autoCapitalize="none" keyboardType={lookupMode==='phone'?'phone-pad':'default'} placeholder={lookupMode==='id'?'사용자 아이디':'국제 형식 전화번호 (+821012345678)'} value={lookup} onChangeText={setLookup} style={{flex:1,backgroundColor:'#F4F5F4',padding:12,borderRadius:9}}/><Pressable disabled={busy} onPress={()=>void addFriend()} style={{backgroundColor:'#FEE500',padding:12,borderRadius:9}}><Text>{busy?'검색 중…':'친구 추가'}</Text></Pressable></View></View>}
      {!!error&&<Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text>}
      {searchOpen && <SearchField value={query} onChangeText={setQuery} placeholder="친구 이름 검색" />}

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.myProfileRow}>
          <Avatar label={profile?.display_name||'나'} color="#E7F4EA" size={58} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{profile?.display_name||'프로필 설정'}</Text>
            <Text style={styles.status}>{profile?.status_message||profile?.username||''}</Text>
          </View>
          <Text style={styles.meLabel}>나</Text>
        </View>

          {visibleFriends.length > 0 && <FriendSection title="친구" friends={visibleFriends.map(f=>({id:f.id,name:f.display_name,status:f.status_message,color:'#E8F4EE'}))} onSelect={id=>router.push({pathname:'/conversation/[id]',params:{id:'new',userId:id}})} onBlock={blockFriend} />}
        {visibleFriends.length === 0 && (
          <Text style={styles.empty}>{query?'검색된 친구가 없습니다.':'아직 친구가 없습니다. 아이디로 친구를 추가해 보세요.'}</Text>
        )}
      </ScrollView>
    </View>
  );
}

function FriendSection({ title, friends: sectionFriends, onSelect, onBlock }: { title: string; friends: FriendRow[]; onSelect:(id:string)=>void; onBlock:(id:string)=>void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{sectionFriends.length}</Text>
      </View>
      {sectionFriends.map((friend) => (
        <Pressable key={friend.id} onPress={()=>onSelect(friend.id)} style={styles.friendRow}>
          <Avatar label={friend.name} color={friend.color} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{friend.name}</Text>
            {friend.status.length > 0 && <Text numberOfLines={1} style={styles.status}>{friend.status}</Text>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${friend.name} 차단`} hitSlop={8} onPress={event=>{event.stopPropagation();onBlock(friend.id)}}><Text style={styles.blockAction}>차단</Text></Pressable>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.page },
  list: { paddingBottom: 24 },
  myProfileRow: {
    minHeight: 88,
    marginHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  friendRow: {
    minHeight: 76,
    marginLeft: 22,
    paddingRight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  profileText: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  status: { color: palette.muted, fontSize: 13 },
  meLabel: { color: palette.muted, fontSize: 12 },
  section: { paddingTop: 17 },
  sectionHeading: {
    minHeight: 34,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: { color: palette.muted, fontSize: 13, fontWeight: '500' },
  count: { color: palette.faint, fontSize: 12 },
  empty: { paddingHorizontal: 22, paddingVertical: 28, color: palette.muted, fontSize: 14 },
  inlineError:{marginHorizontal:22,marginBottom:8,color:palette.danger,fontSize:13},blockAction:{fontSize:12,color:palette.muted,paddingHorizontal:6},
});
