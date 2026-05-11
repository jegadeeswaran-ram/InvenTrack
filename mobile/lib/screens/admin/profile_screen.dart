import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../login_screen.dart';
import '../shell_scope.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl     = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _pwCtrl       = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthService>().user;
    if (user != null) {
      _nameCtrl.text     = user.name;
      _usernameCtrl.text = user.username;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    _pwCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; _success = null; });
    try {
      final token = context.read<AuthService>().token;
      final body  = <String, dynamic>{
        'name':     _nameCtrl.text.trim(),
        'username': _usernameCtrl.text.trim(),
      };
      if (_pwCtrl.text.isNotEmpty) body['password'] = _pwCtrl.text;
      await ApiService.put('/auth/profile', body, token: token);
      if (mounted) setState(() { _success = 'Profile updated!'; _pwCtrl.clear(); });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _logout() async {
    final auth  = context.read<AuthService>();
    final perms = context.read<dynamic>();
    Navigator.pop(context);
    try { perms.clear(); } catch (_) {}
    await auth.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: Navigator.canPop(context)
            ? IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => Navigator.pop(context))
            : IconButton(
                icon: const Icon(Icons.menu_rounded),
                onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
              ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          // Avatar
          CircleAvatar(
            radius: 40,
            backgroundColor: cs.primary,
            child: Text(
              user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
              style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 10),
          Text(user?.name ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          Container(
            margin: const EdgeInsets.only(top: 4),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(user?.role ?? '', style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600, fontSize: 12)),
          ),
          const SizedBox(height: 28),

          // Edit form
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                const SizedBox(height: 16),
                TextField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline_rounded)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _usernameCtrl,
                  decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.alternate_email_rounded)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pwCtrl,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: 'New Password (leave blank to keep)',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                ],
                if (_success != null) ...[
                  const SizedBox(height: 10),
                  Text(_success!, style: const TextStyle(color: Color(0xFF2E9E4F), fontSize: 12)),
                ],
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.save_rounded),
                  label: const Text('Save Changes'),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 16),

          // Logout
          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFE53935)),
            label: const Text('Logout', style: TextStyle(color: Color(0xFFE53935))),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE53935)),
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
        ]),
      ),
    );
  }
}
