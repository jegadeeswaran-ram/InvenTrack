import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, dynamic>? _summary;
  List<dynamic> _topProducts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final token     = context.read<AuthService>().token;
      final monthStr  = DateFormat('yyyy-MM').format(_month);
      final results   = await Future.wait([
        ApiService.get('/reports/summary?month=$monthStr', token: token),
        ApiService.get('/reports/top-products?month=$monthStr&limit=10', token: token),
      ]);
      if (mounted) setState(() {
        _summary     = results[0] as Map<String, dynamic>?;
        _topProducts = results[1] as List? ?? [];
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _changeMonth(int delta) {
    setState(() => _month = DateTime(_month.year, _month.month + delta));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
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
                  // Month selector
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    IconButton(icon: const Icon(Icons.chevron_left_rounded), onPressed: () => _changeMonth(-1)),
                    Text(DateFormat('MMMM yyyy').format(_month),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    IconButton(
                      icon: const Icon(Icons.chevron_right_rounded),
                      onPressed: _month.isBefore(DateTime(DateTime.now().year, DateTime.now().month))
                          ? () => _changeMonth(1) : null,
                    ),
                  ]),
                  const SizedBox(height: 16),

                  if (_summary != null) ...[
                    _kpiRow(cs),
                    const SizedBox(height: 20),
                  ],

                  if (_topProducts.isNotEmpty) ...[
                    Text('Top Products', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const SizedBox(height: 10),
                    ..._topProducts.asMap().entries.map((e) {
                      final i = e.key;
                      final p = e.value as Map<String, dynamic>;
                      final rev = (p['totalRevenue'] as num? ?? 0).toDouble();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: cs.primary.withValues(alpha: 0.1),
                            child: Text('${i + 1}', style: TextStyle(color: cs.primary, fontWeight: FontWeight.w800, fontSize: 12)),
                          ),
                          title: Text(p['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          subtitle: Text('${p['totalQty'] ?? 0} sold', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
                          trailing: Text('₹${rev.toStringAsFixed(0)}',
                              style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary, fontSize: 13)),
                        ),
                      );
                    }),
                  ],
                ]),
              ),
            ),
    );
  }

  Widget _kpiRow(ColorScheme cs) {
    final revenue = (_summary!['totalRevenue'] as num? ?? 0).toDouble();
    final profit  = (_summary!['totalProfit']  as num? ?? 0).toDouble();
    final sales   = (_summary!['totalSales']   as num? ?? 0).toInt();
    return Column(children: [
      Row(children: [
        Expanded(child: _kpi('Revenue', '₹${revenue.toStringAsFixed(0)}', cs.primary)),
        const SizedBox(width: 10),
        Expanded(child: _kpi('Profit',  '₹${profit.toStringAsFixed(0)}',  const Color(0xFF2E9E4F))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: _kpi('Transactions', '$sales', const Color(0xFF0097A7))),
        const SizedBox(width: 10),
        Expanded(child: _kpi('Margin',
            revenue > 0 ? '${(profit / revenue * 100).toStringAsFixed(1)}%' : '—',
            Colors.orange)),
      ]),
    ]);
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
}
