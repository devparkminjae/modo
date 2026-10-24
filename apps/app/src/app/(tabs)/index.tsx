import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

import { Avatar, HeaderAction, ScreenTitle, SearchField, palette } from '@/components/MessengerUI';

type Friend = { id:string; username:string; display_name:string; status_message:string };
type FriendRow = { name:string; status:string; color:string };

export default function FriendsScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [friends,setFriends]=useState<Friend[]>([]); const [addOpen,setAddOpen]=useState(false); const [lookup,setLookup]=useState(''); const [lookupMode,setLookupMode]=useState<'id'|'phone'>('id'); const {profile,refreshProfile}=useAuth();
  const load=async()=>{ if(!supabase)return; const {data}=await supabase.from('friendships').select('requester_id,addressee_id').eq('status','accepted'); const ids=(data||[]).flatMap(x=>[x.requester_id,x.addressee_id]).filter(id=>id!==profile?.id); if(ids.length){const {data:ps}=await supabase.from('profiles').select('id,username,display_name,status_message').in('id',[...new Set(ids)]);setFriends(ps||[])}else setFriends([]); };
  useEffect(()=>{void refreshProfile();void load()},[profile?.id]);
  const visibleFriends=useMemo(()=>friends.filter(f=>f.display_name.includes(query)||f.username.includes(query)),[friends,query]);
  const addFriend=async()=>{if(!supabase||!profile)return;const {data,error}=await supabase.rpc('add_friend_by_lookup',{lookup_value:lookup.trim(),lookup_type:lookupMode});if(error||!data)return Alert.alert('검색 결과 없음',error?.message||'입력 정보를 확인해 주세요.');await load();Alert.alert('친구 추가 완료','친구로 추가했습니다.');setLookup('');setAddOpen(false)};

  return (
    <View style={styles.screen}>
      <ScreenTitle title="친구">
        <HeaderAction label={searchOpen ? '검색 닫기' : '친구 검색'} icon={searchOpen ? 'close' : 'search'} onPress={() => {
          setSearchOpen((open) => !open);
          setQuery('');
        }} />
        <HeaderAction label="친구 추가" icon="addPerson" onPress={() => setAddOpen(v=>!v)} />
      </ScreenTitle>
      {addOpen&&<View style={{marginHorizontal:22,gap:8,marginBottom:8}}><View style={{flexDirection:'row',gap:14}}><Pressable onPress={()=>setLookupMode('id')}><Text style={{fontWeight:lookupMode==='id'?'700':'400'}}>아이디</Text></Pressable><Pressable onPress={()=>setLookupMode('phone')}><Text style={{fontWeight:lookupMode==='phone'?'700':'400'}}>전화번호</Text></Pressable><Pressable onPress={()=>Alert.alert('주소록 친구 추가','모바일 앱에서 연락처 권한을 허용한 뒤, 추가할 사람을 직접 선택하는 기능으로 제공됩니다.') }><Text>주소록</Text></Pressable></View><View style={{flexDirection:'row',gap:8}}><TextInput keyboardType={lookupMode==='phone'?'phone-pad':'default'} placeholder={lookupMode==='id'?'사용자 아이디':'전화번호'} value={lookup} onChangeText={setLookup} style={{flex:1,backgroundColor:'#F4F5F4',padding:12,borderRadius:9}}/><Pressable onPress={addFriend} style={{backgroundColor:'#FEE500',padding:12,borderRadius:9}}><Text>친구 추가</Text></Pressable></View></View>}
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

        {visibleFriends.length > 0 && <FriendSection title="친구" friends={visibleFriends.map(f=>({name:f.display_name,status:f.status_message,color:'#E8F4EE'}))} />}
        {visibleFriends.length === 0 && (
          <Text style={styles.empty}>{query?'검색된 친구가 없습니다.':'아직 친구가 없습니다. 아이디로 친구를 추가해 보세요.'}</Text>
        )}
      </ScrollView>
    </View>
  );
}

function FriendSection({ title, friends: sectionFriends }: { title: string; friends: FriendRow[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{sectionFriends.length}</Text>
      </View>
      {sectionFriends.map((friend) => (
        <View key={friend.name} style={styles.friendRow}>
          <Avatar label={friend.name} color={friend.color} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{friend.name}</Text>
            {friend.status.length > 0 && <Text numberOfLines={1} style={styles.status}>{friend.status}</Text>}
          </View>
        </View>
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
});
