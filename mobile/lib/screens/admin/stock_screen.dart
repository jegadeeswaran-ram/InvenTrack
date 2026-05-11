import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

class StockScreen extends StatefulWidget {
  const StockScreen({super.key});
  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  List<dynamic> _stock = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthService>().token;
      final data  = await ApiService.get('/reports/stock', token: token);
      if (mounted) setState(() => _stock = data as List);
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final filtered = _search.isEmpty
        ? _stock
        : _stock.where((s) => (s['name'] as String).toLowerCase().contains(_search.toLowerCase())).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Search products…',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: filtered.isEmpty
                      ? const Center(child: Text('No products found', style: TextStyle(color: Color(0xFF607D8B))))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final s      = filtered[i] as Map<String, dynamic>;
                            final inHand = (s['inHand'] as num? ?? 0).toDouble();
                            final isLow  = inHand < 50;
                            return Card(
                              child: ListTile(
                                leading: Text(s['emoji'] ?? '🍦', style: const TextStyle(fontSize: 22)),
                                title: Text(s['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                subtitle: Text('₹${(s['sellingPrice'] as num? ?? 0).toStringAsFixed(0)} / pc',
                                    style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: isLow
                                        ? Colors.orange.withValues(alpha: 0.12)
                                        : const Color(0xFF2E9E4F).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${inHand.toStringAsFixed(0)} pcs',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: isLow ? Colors.orange : const Color(0xFF2E9E4F),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
        ),
      ]),
    );
  }
}
