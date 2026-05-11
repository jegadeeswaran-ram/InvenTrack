import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthService>().token;
      final now   = DateTime.now();
      final month = DateFormat('yyyy-MM').format(now);
      final results = await Future.wait([
        ApiService.get('/reports/summary?month=$month', token: token),
        ApiService.get('/reports/stock',                token: token),
      ]);
      if (mounted) setState(() => _data = {'summary': results[0], 'stock': results[1]});
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Greeting
                  Text('Welcome, ${auth.user?.name ?? ''}',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                  Text(DateFormat('EEEE, d MMMM y').format(DateTime.now()),
                      style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                  const SizedBox(height: 20),

                  if (_data != null) ..._buildKpis(cs),

                  const SizedBox(height: 20),
                  _sectionTitle('Stock Alerts', cs),
                  const SizedBox(height: 8),
                  if (_data != null) ..._buildLowStock(cs),
                ]),
              ),
            ),
    );
  }

  List<Widget> _buildKpis(ColorScheme cs) {
    final s = _data!['summary'];
    if (s == null) return [];
    final revenue = (s['totalRevenue'] as num? ?? 0).toDouble();
    final profit  = (s['totalProfit']  as num? ?? 0).toDouble();
    final sales   = (s['totalSales']   as num? ?? 0).toInt();
    return [
      _sectionTitle('This Month', cs),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: _kpi('Revenue',    '₹${revenue.toStringAsFixed(0)}', cs.primary)),
        const SizedBox(width: 10),
        Expanded(child: _kpi('Profit',     '₹${profit.toStringAsFixed(0)}',  const Color(0xFF2E9E4F))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _kpi('Sales',      '$sales txns',                    const Color(0xFF0097A7))),
        const SizedBox(width: 10),
        Expanded(child: _kpi('Margin',     revenue > 0 ? '${(profit / revenue * 100).toStringAsFixed(1)}%' : '—', Colors.orange)),
      ]),
    ];
  }

  List<Widget> _buildLowStock(ColorScheme cs) {
    final stock = (_data!['stock'] as List? ?? []);
    final low = stock.where((s) => (s['inHand'] as num? ?? 0) < 50).toList();
    if (low.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF2E9E4F).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(children: [
            Icon(Icons.check_circle_outline, color: Color(0xFF2E9E4F)),
            SizedBox(width: 10),
            Text('All products well stocked', style: TextStyle(color: Color(0xFF2E9E4F), fontWeight: FontWeight.w600)),
          ]),
        ),
      ];
    }
    return low.take(5).map((s) => Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Text(s['emoji'] ?? '🍦', style: const TextStyle(fontSize: 22)),
        title: Text(s['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.orange.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text('${s['inHand']} left', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w700, fontSize: 12)),
        ),
      ),
    )).toList();
  }

  Widget _kpi(String label, String value, Color color) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withValues(alpha: 0.2)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.7), fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
    ]),
  );

  Widget _sectionTitle(String t, ColorScheme cs) => Text(t,
      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface));
}
