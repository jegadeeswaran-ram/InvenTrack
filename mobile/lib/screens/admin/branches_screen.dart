import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});
  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  List<dynamic> _branches = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.get('/branches', token: auth.token);
      setState(() => _branches = data as List);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Branches'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
        ],
      ),
      floatingActionButton: auth.isAdmin
          ? FloatingActionButton.extended(
              onPressed: () => _showForm(context, auth),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add Branch'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _branches.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _branchCard(_branches[i], cs, auth),
                  ),
                ),
    );
  }

  Widget _branchCard(Map<String, dynamic> b, ColorScheme cs, AuthService auth) {
    final count    = b['_count'] as Map<String, dynamic>?;
    final isActive = b['isActive'] as bool? ?? true;

    return Card(
      child: ListTile(
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: isActive ? 0.12 : 0.05),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.store_mall_directory_rounded, color: isActive ? cs.primary : cs.onSurface.withValues(alpha: 0.3), size: 22),
        ),
        title: Text(b['name'] as String,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isActive ? cs.onSurface : cs.onSurface.withValues(alpha: 0.4),
            )),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if ((b['location'] as String?)?.isNotEmpty == true)
            Text(b['location'] as String, style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
          const SizedBox(height: 2),
          Row(children: [
            Icon(Icons.people_outline, size: 13, color: cs.onSurface.withValues(alpha: 0.4)),
            const SizedBox(width: 3),
            Text('${count?['users'] ?? 0} users', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
            const SizedBox(width: 10),
            Icon(Icons.local_shipping_outlined, size: 13, color: cs.onSurface.withValues(alpha: 0.4)),
            const SizedBox(width: 3),
            Text('${count?['trucks'] ?? 0} trucks', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
          ]),
        ]),
        trailing: auth.isAdmin
            ? PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'edit') _showForm(context, auth, branch: b);
                  if (v == 'toggle') _toggleActive(b);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(
                    value: 'toggle',
                    child: Text(isActive ? 'Deactivate' : 'Activate',
                        style: TextStyle(color: isActive ? Colors.red : const Color(0xFF2E9E4F))),
                  ),
                ],
              )
            : null,
      ),
    );
  }

  Future<void> _toggleActive(Map<String, dynamic> b) async {
    final auth = context.read<AuthService>();
    try {
      await ApiService.put('/branches/${b['id']}', {'isActive': !(b['isActive'] as bool? ?? true)}, token: auth.token);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  void _showForm(BuildContext ctx, AuthService auth, {Map<String, dynamic>? branch}) {
    final isEdit    = branch != null;
    final nameCtrl  = TextEditingController(text: isEdit ? branch['name'] as String : '');
    final locCtrl   = TextEditingController(text: isEdit ? (branch['location'] as String? ?? '') : '');

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        final cs = Theme.of(ctx).colorScheme;
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(isEdit ? 'Edit Branch' : 'Add Branch',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Branch Name')),
              const SizedBox(height: 12),
              TextFormField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Location (optional)')),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  final messenger = ScaffoldMessenger.of(ctx);
                  final body = {'name': nameCtrl.text.trim(), 'location': locCtrl.text.trim()};
                  try {
                    if (isEdit) {
                      await ApiService.put('/branches/${branch['id']}', body, token: auth.token);
                    } else {
                      await ApiService.post('/branches', body, token: auth.token);
                    }
                    if (!ctx.mounted) return;
                    Navigator.pop(ctx);
                    _load();
                  } catch (e) {
                    messenger.showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                  }
                },
                icon: const Icon(Icons.save_rounded),
                label: Text(isEdit ? 'Save Changes' : 'Add Branch'),
              ),
            ]),
          ),
        );
      },
    );
  }
}
