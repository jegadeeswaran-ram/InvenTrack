import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';

class TruckEndDayScreen extends StatefulWidget {
  final Map<String, dynamic> session;
  const TruckEndDayScreen({super.key, required this.session});
  @override
  State<TruckEndDayScreen> createState() => _TruckEndDayScreenState();
}

class _TruckEndDayScreenState extends State<TruckEndDayScreen> {
  bool _saving = false;
  String? _error;

  // One controller per dispatched product
  late final List<Map<String, dynamic>> _items;

  @override
  void initState() {
    super.initState();
    final dispatches = widget.session['dispatches'] as List? ?? [];
    final soldMap    = (widget.session['summary']?['soldMap'] as Map?) ?? {};

    _items = dispatches.map((d) {
      final productId  = d['productId'] as int;
      final dispatched = (d['quantity'] as num).toDouble();
      final sold       = (soldMap['$productId'] as num? ??
                          soldMap[productId]  as num? ?? 0).toDouble();
      final remaining  = (dispatched - sold).clamp(0.0, dispatched);
      return {
        'productId':   productId,
        'productName': (d['product']?['name'] as String?) ?? '',
        'emoji':       (d['product']?['emoji'] as String?) ?? '🍦',
        'dispatched':  dispatched,
        'sold':        sold,
        'remaining':   remaining,
        'ctrl':        TextEditingController(
                         text: remaining > 0 ? remaining.toStringAsFixed(0) : ''),
      };
    }).toList();
  }

  @override
  void dispose() {
    for (final item in _items) {
      (item['ctrl'] as TextEditingController).dispose();
    }
    super.dispose();
  }

  Future<void> _close() async {
    final returns = _items
        .map((i) {
          final qty = double.tryParse((i['ctrl'] as TextEditingController).text) ?? 0;
          return {'productId': i['productId'], 'quantity': qty};
        })
        .where((r) => (r['quantity'] as double) > 0)
        .toList();

    final auth = context.read<AuthService>();
    setState(() { _saving = true; _error = null; });
    try {
      await ApiService.put(
        '/truck-sessions/${widget.session['id']}/close',
        {'returns': returns},
        token: auth.token,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Day closed. Great work today!'),
          backgroundColor: Color(0xFF2E9E4F),
        ),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs      = Theme.of(context).colorScheme;
    final summary = widget.session['summary'] as Map<String, dynamic>?;
    final revenue = (summary?['totalRevenue'] as num? ?? 0).toDouble();
    final profit  = (summary?['totalProfit']  as num? ?? 0).toDouble();

    return Scaffold(
      appBar: AppBar(title: const Text('End Day — Return Stock')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // Day summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF2E9E4F).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF2E9E4F).withValues(alpha: 0.3)),
            ),
            child: Row(children: [
              Expanded(child: _summaryItem("Today's Revenue", '₹${revenue.toStringAsFixed(0)}', cs.primary)),
              Container(width: 1, height: 36, color: cs.onSurface.withValues(alpha: 0.1)),
              Expanded(child: _summaryItem("Today's Profit", '₹${profit.toStringAsFixed(0)}', const Color(0xFF2E9E4F))),
            ]),
          ),
          const SizedBox(height: 20),

          // Info banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFF9800).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(children: [
              Icon(Icons.info_outline, color: Color(0xFFE65100), size: 16),
              SizedBox(width: 8),
              Expanded(child: Text(
                'Enter the quantity of each product you are returning to the branch.',
                style: TextStyle(fontSize: 12, color: Color(0xFFE65100)),
              )),
            ]),
          ),
          const SizedBox(height: 20),

          Text('Return Stock', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface)),
          const SizedBox(height: 12),

          // One row per product
          ..._items.map((item) => _returnRow(item, cs)),

          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 16),
                const SizedBox(width: 8),
                Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
              ]),
            ),
          ],

          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: _saving ? null : _close,
            icon: _saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.check_circle_outline_rounded),
            label: Text(_saving ? 'Closing…' : 'Close Day & Return Stock'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E9E4F),
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
          const SizedBox(height: 20),
        ]),
      ),
    );
  }

  Widget _returnRow(Map<String, dynamic> item, ColorScheme cs) {
    final ctrl       = item['ctrl'] as TextEditingController;
    final dispatched = item['dispatched'] as double;
    final sold       = item['sold']       as double;
    final remaining  = item['remaining']  as double;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Text(item['emoji'] as String, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item['productName'] as String,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 4),
              Row(children: [
                _mini('Loaded', dispatched.toStringAsFixed(0), cs.onSurface.withValues(alpha: 0.45)),
                const SizedBox(width: 8),
                _mini('Sold', sold.toStringAsFixed(0), const Color(0xFF0097A7)),
                const SizedBox(width: 8),
                _mini('Left', remaining.toStringAsFixed(0), cs.primary),
              ]),
            ]),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 72,
            child: TextFormField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textAlign: TextAlign.center,
              decoration: const InputDecoration(
                labelText: 'Return',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) => Column(children: [
    Text(label, style: TextStyle(fontSize: 11, color: _labelColor(color), fontWeight: FontWeight.w500)),
    const SizedBox(height: 4),
    Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color)),
  ]);

  // helper to get a muted version for the summary label
  Color _labelColor(Color c) => c.withValues(alpha: 0.7);

  Widget _mini(String label, String val, Color color) => Row(mainAxisSize: MainAxisSize.min, children: [
    Text('$label: ', style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.7))),
    Text(val, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
  ]);
}
