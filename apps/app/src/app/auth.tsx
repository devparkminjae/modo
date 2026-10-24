import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { palette } from '@/components/MessengerUI';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login'|'signup'|'verify'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [busy, setBusy] = useState(false);
  const act = async () => {
    if (!supabase) return Alert.alert('연결 설정 필요', '앱 환경 변수에 Supabase 설정을 입력해 주세요.');
    setBusy(true);
    try {
      if (mode === 'verify') {
        if (process.env.EXPO_PUBLIC_ALPHA_SKIP_PHONE_OTP === 'true') {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !username) throw new Error('가입한 세션을 확인하지 못했습니다. 다시 가입해 주세요.');
          const { error } = await supabase.from('profiles').upsert({ id:user.id, username:username.toLowerCase(), display_name:name || 'Modo 사용자' });
          if (error) throw error;
          router.replace('/(tabs)'); return;
        }
        const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' }); if (error) throw error; router.replace('/(tabs)'); return;
      }
      if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; router.replace('/(tabs)'); return; }
      const alphaSkipPhone = process.env.EXPO_PUBLIC_ALPHA_SKIP_PHONE_OTP === 'true';
      const { data, error } = await supabase.auth.signUp({ email, password, ...(alphaSkipPhone ? {} : { phone }), options: { data: { username: username.toLowerCase(), display_name: name } } });
      if (error) throw error;
      if (!data.user) throw new Error('계정을 만들지 못했습니다.');
      if (alphaSkipPhone && data.session) {
        const { error: pe } = await supabase.from('profiles').upsert({ id: data.user.id, username: username.toLowerCase(), display_name: name });
        if (pe) throw pe;
        router.replace('/(tabs)'); return;
      }
      if (alphaSkipPhone && !data.session) throw new Error('Supabase 이메일 확인 설정이 켜져 있어 가입을 완료하지 못했습니다. 이메일 확인을 끄거나 확인 후 로그인해 주세요.');
      if (data.session) { const { error: pe } = await supabase.from('profiles').upsert({ id: data.user.id, username: username.toLowerCase(), display_name: name }); if (pe) throw pe; }
      setMode('verify'); Alert.alert('인증 코드 전송', '문자로 받은 인증 코드를 입력해 주세요.');
    } catch (e) { Alert.alert('계정 처리 실패', e instanceof Error ? e.message : '다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={s.fill} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled"><Text style={s.brand}>modo</Text><Text style={s.title}>{mode==='verify'?'전화번호 인증':mode==='signup'?'모도 시작하기':'다시 만나요'}</Text>
    {mode==='signup'&&<><Field label="이름" value={name} set={setName}/><Field label="사용자 아이디" value={username} set={setUsername}/><Field label="전화번호 (+821012345678)" value={phone} set={setPhone}/></>}
    {mode==='verify'?<>{process.env.EXPO_PUBLIC_ALPHA_SKIP_PHONE_OTP === 'true' ? <Text style={s.note}>알파 테스트: SMS 없이 계속합니다. 전화번호 소유 인증은 수행되지 않습니다.</Text> : <Field label="인증 코드" value={code} set={setCode}/>}</>:<><Field label="이메일" value={email} set={setEmail} keyboard="email-address"/><Field label="비밀번호" value={password} set={setPassword} secure/></>}
    <Pressable disabled={busy} style={s.button} onPress={act}><Text style={s.buttonText}>{busy?'처리 중…':mode==='verify'?(process.env.EXPO_PUBLIC_ALPHA_SKIP_PHONE_OTP === 'true'?'알파 테스트 계속':'인증하고 계속'):'계속'}</Text></Pressable>
    {mode!=='verify'&&<Pressable onPress={()=>setMode(mode==='login'?'signup':'login')}><Text style={s.switch}>{mode==='login'?'계정이 없으신가요? 가입하기':'이미 계정이 있으신가요? 로그인'}</Text></Pressable>}
    {mode==='signup'&&<Text style={s.note}>가입 후 전화번호 인증이 필요합니다. SMS 인증은 Supabase의 SMS 제공자 설정에 따라 동작합니다.</Text>}</ScrollView></KeyboardAvoidingView>;
}
function Field({label,value,set,secure,keyboard}:{label:string;value:string;set:(v:string)=>void;secure?:boolean;keyboard?:'email-address'}) { return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput autoCapitalize="none" keyboardType={keyboard} secureTextEntry={secure} value={value} onChangeText={set} style={s.input} /></View>; }
const s=StyleSheet.create({fill:{flex:1,backgroundColor:'#fff'},wrap:{flexGrow:1,justifyContent:'center',padding:28},brand:{fontSize:38,fontWeight:'800',letterSpacing:-2,color:palette.ink},title:{fontSize:23,fontWeight:'700',marginTop:22,marginBottom:22,color:palette.ink},field:{marginBottom:15,gap:7},label:{fontSize:13,color:palette.muted},input:{height:48,borderRadius:9,backgroundColor:'#F4F5F4',paddingHorizontal:14,fontSize:16},button:{height:50,alignItems:'center',justifyContent:'center',backgroundColor:palette.accent,borderRadius:12,marginTop:8},buttonText:{fontWeight:'700',fontSize:16},switch:{textAlign:'center',marginTop:20,color:palette.muted},note:{marginTop:18,color:palette.muted,fontSize:12,lineHeight:18}});
