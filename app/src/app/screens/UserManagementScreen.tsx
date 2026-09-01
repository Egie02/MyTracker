import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import {
  listUsers,
  createUser,
  disableUser,
  enableUser,
  resetPassword,
} from '../../domain/usecases/userUseCase';
import type { User } from '../../domain/models/entities';

export function UserManagementScreen() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [password, setPassword] = useState('');
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    const list = await listUsers();
    setUsers(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) {
      Alert.alert('Error', 'Username and password required.');
      return;
    }
    try {
      await createUser({ username: u, password: p, role });
      setUsername('');
      setPassword('');
      setRole('user');
      setShowForm(false);
      load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create user');
    }
  }

  function handleDisable(user: User) {
    Alert.alert(
      user.is_active ? 'Disable user' : 'Enable user',
      user.is_active ? `Disable "${user.username}"?` : `Enable "${user.username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.is_active ? 'Disable' : 'Enable',
          onPress: async () => {
            if (user.is_active) await disableUser(user.id);
            else await enableUser(user.id);
            load();
          },
        },
      ]
    );
  }

  function handleResetPassword(user: User) {
    setResettingUser(user);
    setNewPassword('');
  }

  async function submitResetPassword() {
    if (!resettingUser || !newPassword.trim()) return;
    await resetPassword(resettingUser.id, newPassword.trim());
    setResettingUser(null);
    setNewPassword('');
    load();
    Alert.alert('Done', 'Password updated.');
  }

  if (showForm) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>New user</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#8892b0"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8892b0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
            onPress={() => setRole('admin')}
          >
            <Text style={styles.roleBtnText}>Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
            onPress={() => setRole('user')}
          >
            <Text style={styles.roleBtnText}>User</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actions}>
          <Button title="Create" onPress={handleCreate} />
          <Button title="Cancel" variant="secondary" onPress={() => { setShowForm(false); setUsername(''); setPassword(''); }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#eee" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      {resettingUser ? (
        <View style={styles.resetBox}>
          <Text style={styles.resetTitle}>Reset password for {resettingUser.username}</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#8892b0"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <View style={styles.row}>
            <Button title="Update" onPress={submitResetPassword} disabled={!newPassword.trim()} />
            <Button title="Cancel" variant="secondary" onPress={() => { setResettingUser(null); setNewPassword(''); }} />
          </View>
        </View>
      ) : (
        <>
      <Text style={styles.title}>User management</Text>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: u }) => (
          <View style={[styles.card, !u.is_active && styles.cardInactive]}>
            <View style={styles.cardMain}>
              <Text style={styles.username}>{u.username}</Text>
              <Text style={styles.meta}>{u.role} · {u.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleResetPassword(u)} style={styles.iconBtn}>
                <Ionicons name="key-outline" size={20} color="#8892b0" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDisable(u)} style={styles.iconBtn}>
                <Ionicons name={u.is_active ? 'close-circle-outline' : 'checkmark-circle-outline'} size={20} color="#e94560" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Button title="Add user" onPress={() => setShowForm(true)} />
      </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#eee', marginLeft: 8 },
  title: { color: '#eee', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  list: { paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardInactive: { opacity: 0.7 },
  cardMain: { flex: 1 },
  username: { color: '#eee', fontSize: 16, fontWeight: '600' },
  meta: { color: '#8892b0', fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row' },
  iconBtn: { padding: 8 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    color: '#eee',
    fontSize: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#16213e', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#e94560' },
  roleBtnText: { color: '#eee' },
  actions: { gap: 12 },
  footer: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  resetBox: { marginBottom: 20 },
  resetTitle: { color: '#eee', marginBottom: 12 },
});
