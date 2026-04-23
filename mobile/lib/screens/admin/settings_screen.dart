import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<dynamic> _products = [];
  List<dynamic> _users = [];
  bool _loadingP = true;
  bool _loadingU = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadProducts();
    _loadUsers();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  String? get _token => context.read<AuthService>().token;

  Future<void> _loadProducts() async {
    try {
      final data = await ApiService.get('/products', token: _token);
      setState(() { _products = data; _loadingP = false; });
    } catch (_) { setState(() => _loadingP = false); }
  }

  Future<void> _loadUsers() async {
    try {
      final data = await ApiService.get('/users', token: _token);
      setState(() { _users = data; _loadingU = false; });
    } catch (_) { setState(() => _loadingU = false); }
  }

  void _showAddProduct() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    String? err;
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(builder: (ctx, setS) => AlertDialog(
        title: const Text('Quick Add Product'),
        content: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Product Name'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 10),
            TextFormField(controller: priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Selling Price ₹'), validator: (v) => v!.isEmpty ? 'Required' : null),
            if (err != null) ...[const SizedBox(height: 8), Text(err!, style: const TextStyle(color: Color(0xFFE53935), fontSize: 12))],
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(onPressed: () async {
            if (!formKey.currentState!.validate()) return;
            try {
              await ApiService.post('/products', {'name': nameCtrl.text.trim(), 'emoji': '🍦', 'sellingPrice': double.parse(priceCtrl.text)}, token: _token);
              if (!ctx.mounted) return;
              Navigator.pop(ctx);
              _loadProducts();
            } catch (e) { setS(() => err = e.toString()); }
          }, child: const Text('Add')),
        ],
      )),
    );
  }

  void _showAddUser() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    String role = 'sales';
    final formKey = GlobalKey<FormState>();
    String? err;
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(builder: (ctx, setS) => AlertDialog(
        title: const Text('Add User'),
        content: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 8),
            TextFormField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 8),
            TextFormField(controller: passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: role,
              decoration: const InputDecoration(labelText: 'Role'),
              items: const [
                DropdownMenuItem(value: 'admin', child: Text('Admin')),
                DropdownMenuItem(value: 'sales', child: Text('Sales')),
              ],
              onChanged: (v) => setS(() => role = v!),
            ),
            if (err != null) ...[const SizedBox(height: 8), Text(err!, style: const TextStyle(color: Color(0xFFE53935), fontSize: 12))],
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(onPressed: () async {
            if (!formKey.currentState!.validate()) return;
            try {
              await ApiService.post('/users', {'name': nameCtrl.text.trim(), 'email': emailCtrl.text.trim(), 'password': passCtrl.text, 'role': role}, token: _token);
              if (!ctx.mounted) return;
              Navigator.pop(ctx);
              _loadUsers();
            } catch (e) { setS(() => err = e.toString()); }
          }, child: const Text('Add')),
        ],
      )),
    );
  }

  Widget _roleBadge(String role) {
    final isAdmin = role == 'admin';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isAdmin ? const Color(0xFFE3F2FD) : const Color(0xFFF3E5F5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isAdmin ? const Color(0xFF1565C0) : const Color(0xFF6A1B9A))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        leading: IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer()),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => context.read<ThemeNotifier>().toggle(),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(icon: Icon(Icons.sell_outlined), text: 'Products'),
            Tab(icon: Icon(Icons.people_outline), text: 'Users'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab_settings',
        onPressed: () => _tabs.index == 0 ? _showAddProduct() : _showAddUser(),
        backgroundColor: const Color(0xFF0097A7),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          // Products tab
          _loadingP
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadProducts,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _products.length,
                    itemBuilder: (_, i) {
                      final p = _products[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: p['imageUrl'] != null
                              ? ClipRRect(borderRadius: BorderRadius.circular(6), child: Image.network(p['imageUrl'], width: 40, height: 40, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.icecream_outlined)))
                              : const CircleAvatar(backgroundColor: Color(0xFFE0F7FA), child: Icon(Icons.icecream_outlined, color: Color(0xFF0097A7))),
                          title: Text(p['name'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('₹${p['sellingPrice']}'),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: p['isActive'] == true ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE), borderRadius: BorderRadius.circular(20)),
                            child: Text(p['isActive'] == true ? 'Active' : 'Inactive', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: p['isActive'] == true ? const Color(0xFF2E7D32) : const Color(0xFFB71C1C))),
                          ),
                        ),
                      );
                    },
                  ),
                ),
          // Users tab
          _loadingU
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadUsers,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _users.length,
                    itemBuilder: (_, i) {
                      final u = _users[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF0097A7),
                            child: Text(((u['name'] as String?) ?? 'U').isNotEmpty ? ((u['name'] as String?) ?? 'U')[0].toUpperCase() : 'U', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                          ),
                          title: Text((u['name'] as String?) ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text((u['email'] as String?) ?? ''),
                          trailing: _roleBadge(u['role']),
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}
