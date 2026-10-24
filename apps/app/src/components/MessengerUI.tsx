import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, TextInput, View, type ColorValue } from 'react-native';

export const palette = {
  page: '#FFFFFF',
  ink: '#191B1A',
  muted: '#6F7472',
  faint: '#B5B9B8',
  line: '#ECEEED',
  accent: '#FEE500',
  accentSoft: '#FFF9C7',
  input: '#F4F5F4',
  danger: '#E54B50',
};

type IconKey = 'search' | 'addPerson' | 'compose' | 'friends' | 'chats' | 'settings' | 'close' | 'chevron' | 'back' | 'contact' | 'qr' | 'phone' | 'id' | 'check';

const icons: Record<IconKey, SymbolViewProps['name']> = {
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  addPerson: { ios: 'person.crop.circle.badge.plus', android: 'person_add', web: 'person_add' },
  compose: { ios: 'square.and.pencil', android: 'edit_square', web: 'edit_square' },
  friends: { ios: 'person.2', android: 'group', web: 'group' },
  chats: { ios: 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  contact: { ios: 'person.crop.rectangle.stack', android: 'contacts', web: 'contacts' },
  qr: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  id: { ios: 'at', android: 'alternate_email', web: 'alternate_email' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
};

export function AppIcon({
  name,
  color = palette.ink,
  size = 23,
}: {
  name: IconKey;
  color?: ColorValue;
  size?: number;
}) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}

export function HeaderAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconKey;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
      <AppIcon name={icon} color={palette.ink} size={22} />
    </Pressable>
  );
}

export function ScreenTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.titleRow}>
      <Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>
      <View style={styles.titleActions}>{children}</View>
    </View>
  );
}

export function Avatar({
  label,
  color,
  size = 54,
}: {
  label: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      accessibilityLabel={`${label} 프로필`}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarLabel, { fontSize: Math.round(size * 0.34) }]}>{label.slice(0, 1)}</Text>
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchField}>
      <AppIcon name="search" color={palette.muted} size={18} />
      <TextInput
        accessibilityLabel={placeholder}
        autoFocus
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    minHeight: 66,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  pressed: { opacity: 0.55 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLabel: {
    color: '#26312C',
    fontWeight: '600',
  },
  searchField: {
    height: 44,
    marginHorizontal: 22,
    marginBottom: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 20,
    backgroundColor: palette.input,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: palette.ink,
    fontSize: 14,
  },
});
