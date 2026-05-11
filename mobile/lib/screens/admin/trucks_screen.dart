import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class TrucksScreen extends StatefulWidget {
  const TrucksScreen({super.key});
  @override
  State<TrucksScreen> createState() => _TrucksScreenState();
}

class _TrucksScreenState extends State<TrucksScreen> {
  List<dynamic> _trucks    = [];
  List<dynamic> _branches  = [];
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
      final results = await Future.wait([
        ApiService.get('/trucks', token: auth.token),
        ApiService.get('/branches', token: auth.token),
      ]);
      setState(() {
        _trucks   = results[0] as List;
        _branches = results[1] as List;
      });
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
        title: const Text('Trucks'),
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
              label: const Text('Add Truck'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _trucks.isEmpty
                      ? const Center(child: Text('No trucks found', style: TextStyle(color: Color(0xFF607D8B))))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _trucks.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, i) => _truckCard(_trucks[i], cs, auth),
                        ),
                ),
    );
  }

  Widget _truckCard(Map<String, dynamic> t, ColorScheme cs, AuthService auth) {
    final branch   = t['branch'] as Map<String, dynamic>?;
    final isActive = t['isActive'] as bool? ?? true;
    final count    = t['_count'] as Map<String, dynamic>?;

    return Card(
      child: ListTile(
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFF0097A7).withValues(alpha: isActive ? 0.12 : 0.05),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.local_shipping_rounded,
              color: isActive ? const Color(0xFF0097A7) : cs.onSurface.withValues(alpha: 0.3),
              size: 22),
        ),
        title: Text(t['name'] as String,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isActive ? cs.onSurface : cs.onSurface.withValues(alpha: 0.4),
            )),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if ((t['plateNumber'] as String?)?.isNotEmpty == true)
            Text(t['plateNumber'] as String,
                style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
          Row(children: [
            Icon(Icons.store_mall_directory_outlined, size: 13, color: cs.onSurface.withValues(alpha: 0.4)),
            const SizedBox(width: 3),
            Text(branch?['name'] ?? '', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
            if (count != null) ...[
              const SizedBox(width: 10),
              Icon(Icons.receipt_long_outlined, size: 13, color: cs.onSurface.withValues(alpha: 0.4)),
              const SizedBox(width: 3),
              Text('${count['sessions'] ?? 0} sessions', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
            ],
          ]),
        ]),
        trailing: auth.isAdmin
            ? PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'edit') _showForm(context, auth, truck: t);
                  if (v == 'toggle') _toggleActive(t);
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

  Future<void> _toggleActive(Map<String, dynamic> t) async {
    final auth = context.read<AuthService>();
    try {
      await ApiService.put('/trucks/${t['id']}', {'isActive': !(t['isActive'] as bool? ?? true)}, token: auth.token);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  void _showForm(BuildContext ctx, AuthService auth, {Map<String, dynamic>? truck}) {
    final isEdit      = truck != null;
    final nameCtrl    = TextEditingController(text: isEdit ? truck['name'] as String : '');
    final plateCtrl   = TextEditingController(text: isEdit ? (truck['plateNumber'] as String? ?? '') : '');
    final truckBranch = isEdit ? truck['branch'] as Map<String, dynamic>? : null;
    int? selectedBranchId = truckBranch?['id'] as int? ??
        (_branches.isNotEmpty ? _branches[0]['id'] as int : null);

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (sheetCtx, setSt) {
          final cs = Theme.of(sheetCtx).colorScheme;
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(isEdit ? 'Edit Truck' : 'Add Truck',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Truck Name')),
                const SizedBox(height: 12),
                TextFormField(controller: plateCtrl, decoration: const InputDecoration(labelText: 'Plate Number (optional)')),
                const SizedBox(height: 12),
                if (_branches.isNotEmpty)
                  DropdownButtonFormField<int>(
                    initialValue: selectedBranchId,
                    decoration: const InputDecoration(labelText: 'Branch'),
                    items: _branches.map<DropdownMenuItem<int>>((b) =>
                        DropdownMenuItem(value: b['id'] as int, child: Text(b['name'] as String))).toList(),
                    onChanged: (v) => setSt(() => selectedBranchId = v),
                  ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty || selectedBranchId == null) return;
                    final messenger = ScaffoldMessenger.of(ctx);
                    final body = {
                      'name': nameCtrl.text.trim(),
                      'plateNumber': plateCtrl.text.trim().isEmpty ? null : plateCtrl.text.trim(),
                      'branchId': selectedBranchId,
                    };
                    try {
                      if (isEdit) {
                        await ApiService.put('/trucks/${truck['id']}', body, token: auth.token);
                      } else {
                        await ApiService.post('/trucks', body, token: auth.token);
                      }
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      _load();
                    } catch (e) {
                      messenger.showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                    }
                  },
                  icon: const Icon(Icons.save_rounded),
                  label: Text(isEdit ? 'Save Changes' : 'Add Truck'),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }
}
