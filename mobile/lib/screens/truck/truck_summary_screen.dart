import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/truck_service.dart';

class TruckSummaryScreen extends StatefulWidget {
  final Map<String, dynamic> session;
  const TruckSummaryScreen({super.key, required this.session});
  @override
  State<TruckSummaryScreen> createState() => _TruckSummaryScreenState();
}

class _TruckSummaryScreenState extends State<TruckSummaryScreen> {
  List<dynamic> _sales = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthService>().token!;
    try {
      final data = await TruckService.getSales(token, widget.session['id'] as int);
      if (mounted) setState(() { _sales = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _totalAmount => _sales.fold(0.0, (s, sale) => s + (sale['totalAmount'] as num).toDouble());

  // Aggregate items by product
  Map<int, Map<String, dynamic>> get _productTotals {
    final map = <int, Map<String, dynamic>>{};
    for (final sale in _sales) {
      for (final item in (sale['items'] as List)) {
        final pid = item['productId'] as int;
        if (!map.containsKey(pid)) {
          map[pid] = {
            'product': item['product'],
            'qty': 0.0,
            'amount': 0.0,
          };
        }
        map[pid]!['qty'] = (map[pid]!['qty'] as double) + (item['quantity'] as num).toDouble();
        map[pid]!['amount'] = (map[pid]!['amount'] as double) + (item['total'] as num).toDouble();
      }
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isOpen = widget.session['status'] == 'OPEN';

    return Scaffold(
      appBar: AppBar(title: const Text('Sales Summary')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Session info
                  _infoCard(isDark, cs),
                  const SizedBox(height: 16),

                  // KPI row
                  Row(children: [
                    Expanded(child: _kpiCard('Transactions', '${_sales.length}', Icons.receipt_long_rounded, cs.primary, isDark)),
                    const SizedBox(width: 10),
                    Expanded(child: _kpiCard('Total Sales', '₹${_totalAmount.toStringAsFixed(0)}', Icons.currency_rupee_rounded, Colors.green, isDark)),
                  ]),
                  const SizedBox(height: 16),

                  // Product breakdown
                  if (_productTotals.isNotEmpty) ...[
                    Text('Product Breakdown', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const SizedBox(height: 10),
                    ..._productTotals.values.map((entry) => _productRow(entry, isDark, cs)),
                    const SizedBox(height: 16),
                  ],

                  // Individual transactions
                  if (_sales.isNotEmpty) ...[
                    Text('Transactions (${_sales.length})', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const SizedBox(height: 10),
                    ..._sales.asMap().entries.map((e) => _transactionCard(e.key + 1, e.value, isDark, cs)),
                  ],

                  if (_sales.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(children: [
                          Icon(Icons.receipt_long_outlined, size: 48, color: cs.onSurface.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text(isOpen ? 'No sales yet today' : 'No sales recorded',
                              style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5))),
                        ]),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _infoCard(bool isDark, ColorScheme cs) {
    final truck = widget.session['truck'];
    final branch = widget.session['branch'];
    final status = widget.session['status'] as String;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Icon(Icons.local_shipping_rounded, color: cs.primary, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (truck != null) Text(truck['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          if (branch != null) Text(branch['name'] as String, style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: (status == 'OPEN' ? Colors.green : cs.primary).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: status == 'OPEN' ? Colors.green : cs.primary)),
        ),
      ]),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
      ]),
    );
  }

  Widget _productRow(Map<String, dynamic> entry, bool isDark, ColorScheme cs) {
    final product = entry['product'] as Map<String, dynamic>;
    final qty = entry['qty'] as double;
    final amount = entry['amount'] as double;

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [
        Text(product['emoji'] as String? ?? '🍦', style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 10),
        Expanded(child: Text(product['name'] as String,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            maxLines: 1, overflow: TextOverflow.ellipsis)),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${qty.toStringAsFixed(0)} pcs', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.7))),
          Text('₹${amount.toStringAsFixed(0)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.primary)),
        ]),
      ]),
    );
  }

  Widget _transactionCard(int txNum, Map<String, dynamic> sale, bool isDark, ColorScheme cs) {
    final items = sale['items'] as List;
    final total = ((sale['totalAmount'] as num?)?.toDouble()) ?? 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('Sale #$txNum', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          const Spacer(),
          Text('₹${total.toStringAsFixed(2)}', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: cs.primary)),
        ]),
        const SizedBox(height: 6),
        ...items.map((item) {
          final p = item['product'] as Map<String, dynamic>;
          final q = ((item['quantity'] as num?)?.toDouble()) ?? 0.0;
          final price = ((item['price'] as num?)?.toDouble()) ?? 0.0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: Row(children: [
              Text(p['emoji'] as String? ?? '🍦', style: const TextStyle(fontSize: 13)),
              const SizedBox(width: 6),
              Expanded(child: Text(p['name'] as String, style: const TextStyle(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
              Text('${q.toStringAsFixed(0)} × ₹${price.toStringAsFixed(0)}',
                  style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            ]),
          );
        }),
      ]),
    );
  }
}
