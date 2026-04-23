import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class StockScreen extends StatefulWidget {
  const StockScreen({super.key});
  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  List<dynamic> _stock = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final token = context.read<AuthService>().token;
    try {
      final data = await ApiService.get('/reports/stock', token: token);
      setState(() { _stock = data; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Widget _badge(double inHand) {
    if (inHand <= 0) return _chip('Out of Stock', const Color(0xFFFFEBEE), const Color(0xFFB71C1C));
    if (inHand <= 20) return _chip('Low', const Color(0xFFFFF3E0), const Color(0xFFE65100));
    return _chip('Healthy', const Color(0xFFE8F5E9), const Color(0xFF2E7D32));
  }

  Widget _chip(String text, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(text, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700)),
  );

  Widget _productImage(dynamic p) {
    final imageUrl = p['imageUrl'] as String?;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(imageUrl, width: 70, height: 70, fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder()),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: 70, height: 70,
      decoration: BoxDecoration(color: cs.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
      child: Icon(Icons.icecream_outlined, color: cs.primary.withOpacity(0.4), size: 30),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Current Stock'),
        leading: IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer()),
        actions: [IconButton(icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined), onPressed: () => context.read<ThemeNotifier>().toggle())],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _stock.map((p) {
                    final inHand = (p['inHand'] as num).toDouble();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10)],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          _productImage(p),
                          const SizedBox(width: 14),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(p['productName'], style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface)),
                            const SizedBox(height: 6),
                            _badge(inHand),
                          ])),
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Text(inHand.toStringAsFixed(0), style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: cs.primary, height: 1)),
                            Text('in hand', style: TextStyle(fontSize: 10, color: cs.onSurface.withOpacity(0.45))),
                          ]),
                        ]),
                        const SizedBox(height: 14),
                        Divider(height: 1, color: cs.onSurface.withOpacity(0.08)),
                        const SizedBox(height: 12),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                          _stat('Purchased', (p['totalPurchased'] as num).toStringAsFixed(0), cs),
                          _vDivider(cs),
                          _stat('Sold', (p['totalSold'] as num).toStringAsFixed(0), cs),
                          _vDivider(cs),
                          _stat('Avg Buy', '₹${(p['avgCostPerUnit'] as num).toStringAsFixed(2)}', cs),
                          _vDivider(cs),
                          _stat('Avg Sell', '₹${(p['avgSellPerUnit'] as num).toStringAsFixed(2)}', cs),
                        ]),
                      ]),
                    );
                  }).toList(),
                ),
              ),
            ),
    );
  }

  Widget _vDivider(ColorScheme cs) => Container(height: 28, width: 1, color: cs.onSurface.withOpacity(0.08));

  Widget _stat(String label, String value, ColorScheme cs) => Column(children: [
    Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: cs.onSurface)),
    const SizedBox(height: 2),
    Text(label, style: TextStyle(color: cs.onSurface.withOpacity(0.45), fontSize: 10)),
  ]);
}
