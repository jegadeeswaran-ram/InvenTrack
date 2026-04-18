import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  List<dynamic> _users = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  String? get _token => context.read<AuthService>().token;

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/users', token: _token);
      setState(() { _users = data; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  void _showForm({Map<String, dynamic>? user}) {
    final isEdit = user != null;
    final nameCtrl = TextEditingController(text: user?['name'] ?? '');
    final usernameCtrl = TextEditingController(text: user?['username'] ?? '');
    final passwordCtrl = TextEditingController();
    String role = user?['role'] ?? 'SALES';
    final formKey = GlobalKey<FormState>();
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(isEdit ? 'Edit User' : 'Add User', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: usernameCtrl,
                  decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.account_circle_outlined)),
                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: passwordCtrl,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: isEdit ? 'New Password (leave blank to keep)' : 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                  ),
                  validator: (v) => !isEdit && (v == null || v.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: role,
                  decoration: const InputDecoration(labelText: 'Role', prefixIcon: Icon(Icons.badge_outlined)),
                  items: const [
                    DropdownMenuItem(value: 'SALES', child: Text('SALES')),
                    DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
                  ],
                  onChanged: (v) => setModalState(() => role = v!),
                ),
                if (errorMsg != null) ...[
                  const SizedBox(height: 8),
                  Text(errorMsg!, style: const TextStyle(color: Color(0xFFE53935), fontSize: 13)),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    setModalState(() => errorMsg = null);
                    try {
                      final body = <String, dynamic>{
                        'name': nameCtrl.text.trim(),
                        'username': usernameCtrl.text.trim(),
                        'role': role,
                      };
                      if (passwordCtrl.text.isNotEmpty) body['password'] = passwordCtrl.text;
                      if (!isEdit) {
                        await ApiService.post('/users', body, token: _token);
                      } else {
                        await ApiService.put('/users/${user['id']}', body, token: _token);
                      }
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      _load();
                    } catch (e) {
                      setModalState(() => errorMsg = e.toString());
                    }
                  },
                  child: Text(isEdit ? 'Update User' : 'Create User'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _viewUser(Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(user['name']),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _detailRow('Username', user['username']),
            _detailRow('Role', user['role']),
            _detailRow('Status', user['isActive'] ? 'Active' : 'Inactive'),
            _detailRow('Created', _formatDate(user['createdAt'])),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      SizedBox(width: 80, child: Text(label, style: const TextStyle(color: Color(0xFF607D8B), fontSize: 13))),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
    ]),
  );

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    try { return iso.split('T')[0]; } catch (_) { return iso; }
  }

  Future<void> _toggleActive(Map<String, dynamic> user) async {
    try {
      await ApiService.patch('/users/${user['id']}/toggle', token: _token);
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _delete(Map<String, dynamic> user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete User'),
        content: Text('Delete "${user['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Color(0xFFE53935))),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ApiService.delete('/users/${user['id']}', token: _token);
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(),
        backgroundColor: const Color(0xFF0097A7),
        child: const Icon(Icons.person_add, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _users.isEmpty
                  ? const Center(child: Text('No users found'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _users.length,
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        final isActive = u['isActive'] == true;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: u['role'] == 'ADMIN' ? const Color(0xFF0097A7) : const Color(0xFF43A047),
                              child: Text(
                                (u['name'] as String? ?? 'U').isNotEmpty ? (u['name'] as String? ?? 'U').substring(0, 1).toUpperCase() : 'U',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                              ),
                            ),
                            title: Text(u['name'], style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('@${u['username']} · ${u['role']}'),
                            trailing: PopupMenuButton<String>(
                              onSelected: (action) {
                                if (action == 'view') _viewUser(u);
                                if (action == 'edit') _showForm(user: Map<String, dynamic>.from(u));
                                if (action == 'toggle') _toggleActive(u);
                                if (action == 'delete') _delete(u);
                              },
                              itemBuilder: (_) => [
                                const PopupMenuItem(value: 'view', child: Row(children: [Icon(Icons.visibility_outlined, size: 18), SizedBox(width: 8), Text('View')])),
                                const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')])),
                                PopupMenuItem(value: 'toggle', child: Row(children: [
                                  Icon(isActive ? Icons.block_outlined : Icons.check_circle_outline, size: 18),
                                  const SizedBox(width: 8),
                                  Text(isActive ? 'Deactivate' : 'Activate'),
                                ])),
                                const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: Color(0xFFE53935)), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Color(0xFFE53935)))])),
                              ],
                            ),
                            tileColor: isActive ? null : const Color(0xFFFAFAFA),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

