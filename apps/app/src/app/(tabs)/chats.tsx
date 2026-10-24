import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, HeaderAction, ScreenTitle, palette } from '@/components/MessengerUI';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Membership = { conversation_id: string; last_read_at: string | null; conversation: { id: string; kind: string; title: string | null; participant_a: string | null; participant_b: string | null; updated_at: string } };
type Item = { id: string; name: string; preview: string; updated: string; unread: number };

export default function ChatsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [group, setGroup] = useState(false);
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error: queryError } = await supabase.from('conversation_members')
      .select('conversation_id,last_read_at,conversation:conversations(id,kind,title,participant_a,participant_b,updated_at)')
      .eq('user_id', user.id);
    if (queryError) { setError(queryError.message); return; }
    const rows = (data || []) as unknown as Membership[];
    const mapped = await Promise.all(rows.map(async membership => {
      const conversation = membership.conversation;
      let name = conversation.title || '대화';
      if (conversation.kind === 'direct') {
        const other = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
        const { data: person } = await supabase!.from('profiles').select('display_name').eq('id', other).maybeSingle();
        name = person?.display_name || '친구';
      }
      const { data: lastMessage } = await supabase!.from('messages').select('body,created_at')
        .eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!lastMessage) return null;
      let unreadQuery = supabase!.from('messages').select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id).neq('sender_id', user.id);
      if (membership.last_read_at) unreadQuery = unreadQuery.gt('created_at', membership.last_read_at);
      const { count } = await unreadQuery;
      return { id: conversation.id, name, preview: lastMessage.body, updated: lastMessage.created_at, unread: count || 0 };
    }));
    setItems(mapped.filter((item): item is Item => item !== null).sort((a, b) => b.updated.localeCompare(a.updated)));
  }, [user?.id]);

  useEffect(() => {
    void load();
    if (!supabase || !user) return;
    const channel = supabase.channel(`chat-list:${user.id}`).on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' }, () => void load()).subscribe();
    return () => { void supabase!.removeChannel(channel); };
  }, [load, user?.id]);

  const createGroup = async () => {
    if (!supabase || !user || !title.trim()) return;
    setBusy(true); setError('');
    try {
      const usernames = members.split(',').map(value => value.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
      const { data: people, error: lookupError } = await supabase.from('profiles').select('id,username').in('username', usernames);
      if (lookupError) throw lookupError;
      if (!people || people.length !== usernames.length || people.some(person => person.id === user.id)) throw new Error('친구 아이디를 확인해 주세요.');
      const { data: id, error: createError } = await supabase.rpc('create_group_conversation', { group_title: title.trim(), member_ids: people.map(person => person.id) });
      if (createError) throw createError;
      if (!id) throw new Error('대화방을 만들지 못했습니다.');
      setGroup(false); setTitle(''); setMembers('');
      router.push({ pathname: '/conversation/[id]', params: { id, title: title.trim() } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '단체 대화방을 만들지 못했습니다.');
    } finally { setBusy(false); }
  };

  return <View style={styles.screen}>
    <ScreenTitle title="채팅"><HeaderAction label="단체 채팅 만들기" icon="compose" onPress={() => setGroup(value => !value)} /></ScreenTitle>
    {group && <View style={styles.form}>
      <TextInput placeholder="대화방 이름" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="친구 아이디 (쉼표로 구분)" value={members} onChangeText={setMembers} style={styles.input} />
      <Pressable disabled={busy} onPress={() => void createGroup()} style={styles.button}><Text>{busy ? '만드는 중…' : '방 만들기'}</Text></Pressable>
    </View>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <FlatList data={items} keyExtractor={item => item.id}
      ListEmptyComponent={<Text style={styles.empty}>메시지를 주고받은 대화가 여기에 표시됩니다.</Text>}
      renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id, title: item.name } })} style={styles.row}>
        <Avatar label={item.name} color="#E8F4EE" size={54} />
        <View style={styles.detail}><View style={styles.heading}><Text style={styles.name}>{item.name}</Text><Text style={styles.time}>{new Date(item.updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View><View style={styles.heading}><Text numberOfLines={1} style={styles.preview}>{item.preview}</Text>{item.unread > 0 && <Text style={styles.badge}>{item.unread}</Text>}</View></View>
      </Pressable>} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.page },
  row: { minHeight: 78, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 13 },
  detail: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line, minHeight: 78, justifyContent: 'center', gap: 7 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 16, fontWeight: '600', color: palette.ink },
  preview: { flex: 1, fontSize: 13, color: palette.muted },
  time: { fontSize: 11, color: palette.faint },
  badge: { minWidth: 20, height: 20, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', borderRadius: 10, paddingHorizontal: 5, color: '#252525', backgroundColor: '#FEE500', fontSize: 11, fontWeight: '700' },
  empty: { padding: 26, color: palette.muted },
  form: { paddingHorizontal: 22, paddingBottom: 12, gap: 8 },
  input: { backgroundColor: '#F4F5F4', padding: 12, borderRadius: 9 },
  button: { backgroundColor: '#FEE500', padding: 12, alignItems: 'center', borderRadius: 9 },
  error: { paddingHorizontal: 22, paddingBottom: 10, color: palette.danger, fontSize: 13 },
});
