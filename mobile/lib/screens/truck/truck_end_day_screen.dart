import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/truck_service.dart';

class TruckEndDayScreen extends StatefulWidget {
  final Map<String, dynamic> session;
  const TruckEndDayScreen({super.key, required this.session});
  @override
  State<TruckEndDayScreen> createState() => _TruckEndDayScreenState();
}

class _TruckEndDayScreenState extends State<TruckEndDayScreen> {
  List<dynamic> _products = [];
  Map<int, double> _soldQty = {}; // productId → total sold
  Map<int, TextEditingController> _closingCtrl = {};
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in _closingCtrl.values) c.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final token = context.read<AuthService>().token!;
    try {
      final results = await Future.wait([
        TruckService.getProducts(token),
        TruckService.getSales(token, widget.session['id'] as int),
      ]);
      final products = (results[0] as List).where((p) => p['isActive'] == true).toList();
      final sales = results[1] as List;

      // Aggregate sold qty per product
      final soldMap = <int, double>{};
      for (final sale in sales) {
        for (final item in (sale['items'] as List)) {
          final pid = item['productId'] as int;
          soldMap[pid] = (soldMap[pid] ?? 0) + (item['quantity'] as num).toDouble();
        }
      }

      // Only show products that were sold OR need closing stock
      final relevantProducts = products.where((p) => soldMap.containsKey(p['id'] as int)).toList();

      final controllers = <int, TextEditingController>{};
      for (final p in relevantProducts) {
        controllers[p['id'] as int] = TextEditingController(text: '0');
      }

      if (mounted) {
        setState(() {
          _products = relevantProducts;
          _soldQty = soldMap;
          _closingCtrl = controllers;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _allFilled => _products.every((p) {
    final pid = p['id'] as int;
    final text = _closingCtrl[pid]?.text ?? '';
    return text.isNotEmpty && double.tryParse(text) != null && double.parse(text) >= 0;
  });

  Future<void> _closeDay() async {
    if (!_allFilled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter closing stock for all products'), backgroundColor: Colors.orange),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Close Day?'),
        content: const Text('This will close the session. You cannot add sales after closing. Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
            child: const Text('Close Day'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _saving = true);
    final token = context.read<AuthService>().token!;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final closingStocks = _products.map((p) {
      final pid = p['id'] as int;
      return {
        'productId': pid,
        'closingQty': double.parse(_closingCtrl[pid]!.text),
      };
    }).toList();

    try {
      await TruckService.closeDay(token, widget.session['id'] as int, closingStocks);
      messenger.showSnackBar(
        const SnackBar(content: Text('Day closed successfully!'), backgroundColor: Colors.green),
      );
      navigator.pop();
    } catch (e) {
      if (mounted) setState(() => _saving = false);
      messenger.showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('End Day — Closing Stock')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              // Info banner
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: Row(children: [
                  const Icon(Icons.info_outline_rounded, color: Colors.orange, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Enter the remaining (unsold) stock for each product.\nOpening Stock = Sold + Closing Stock',
                      style: TextStyle(fontSize: 12, color: Colors.orange.shade800),
                    ),
                  ),
                ]),
              ),

              if (_products.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.check_circle_outline_rounded, size: 56, color: Colors.green.withValues(alpha: 0.7)),
                      const SizedBox(height: 12),
                      const Text('No sales recorded yet today', style: TextStyle(fontSize: 15)),
                      const SizedBox(height: 6),
                      Text('Record some sales before closing', style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.5))),
                    ]),
                  ),
                )
              else ...[
                // Header row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(children: [
                    const Expanded(flex: 3, child: Text('Product', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700))),
                    Expanded(child: Text('Sold', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: cs.primary), textAlign: TextAlign.center)),
                    Expanded(child: const Text('Closing', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700), textAlign: TextAlign.center)),
                    Expanded(child: Text('Opening*', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.orange), textAlign: TextAlign.center)),
                  ]),
                ),
                const Divider(height: 1),

                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: _products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 6),
                    itemBuilder: (context, i) {
                      final p = _products[i];
                      final pid = p['id'] as int;
                      final sold = _soldQty[pid] ?? 0;
                      final ctrl = _closingCtrl[pid]!;
                      final closing = double.tryParse(ctrl.text) ?? 0;
                      final opening = sold + closing;

                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1A2635) : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(children: [
                          Expanded(
                            flex: 3,
                            child: Row(children: [
                              Text(p['emoji'] as String? ?? '🍦', style: const TextStyle(fontSize: 16)),
                              const SizedBox(width: 6),
                              Expanded(child: Text(p['name'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 2, overflow: TextOverflow.ellipsis)),
                            ]),
                          ),
                          Expanded(
                            child: Text('${sold.toStringAsFixed(0)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.primary), textAlign: TextAlign.center),
                          ),
                          Expanded(
                            child: SizedBox(
                              height: 38,
                              child: TextField(
                                controller: ctrl,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                  filled: true,
                                  fillColor: isDark ? const Color(0xFF243040) : const Color(0xFFF5F8FA),
                                ),
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text('${opening.toStringAsFixed(0)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.orange), textAlign: TextAlign.center),
                          ),
                        ]),
                      );
                    },
                  ),
                ),
              ],
            ]),

      bottomNavigationBar: _products.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton.icon(
                  onPressed: _saving ? null : _closeDay,
                  icon: _saving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.lock_clock_rounded),
                  label: Text(_saving ? 'Closing…' : 'Close Day'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                ),
              ),
            ),
    );
  }
}
