import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';
import 'truck_end_day_screen.dart';

class TruckDashboardScreen extends StatefulWidget {
  const TruckDashboardScreen({super.key});
  @override
  State<TruckDashboardScreen> createState() => _TruckDashboardScreenState();
}

class _TruckDashboardScreenState extends State<TruckDashboardScreen> {
  Map<String, dynamic>? _session;
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
      final data = await ApiService.get('/truck-sessions/my-session', token: token);
      if (mounted) setState(() => _session = data as Map<String, dynamic>?);
    } catch (_) {
      // session stays null — waiting state shown
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Remaining qty for a product = dispatched - sold
  double _remaining(int productId) {
    final dispatches = (_session!['dispatches'] as List? ?? []);
    final soldMap    = (_session!['summary']?['soldMap'] as Map?) ?? {};
    final dispatched = dispatches
        .where((d) => d['productId'] == productId)
        .fold<double>(0, (a, d) => a + (d['quantity'] as num).toDouble());
    final sold = (soldMap['$productId'] as num? ??
                  soldMap[productId] as num? ?? 0).toDouble();
    return (dispatched - sold).clamp(0, double.infinity);
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Truck'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: _session == null
                    ? _buildWaiting(cs, auth)
                    : _buildActive(cs, auth),
              ),
            ),
    );
  }

  // ── No session yet ──────────────────────────────────────────────────────────

  Widget _buildWaiting(ColorScheme cs, AuthService auth) {
    return Column(children: [
      const SizedBox(height: 40),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
        ),
        child: Column(children: [
          Icon(Icons.local_shipping_outlined, size: 64, color: cs.primary.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('Waiting for Dispatch',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
          const SizedBox(height: 10),
          Text(
            'Your truck has not been loaded yet.\nContact your manager to start today\'s dispatch.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.5), height: 1.5),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Check Again'),
          ),
        ]),
      ),
      const SizedBox(height: 24),
      _driverCard(cs, auth),
    ]);
  }

  // ── Active session ──────────────────────────────────────────────────────────

  Widget _buildActive(ColorScheme cs, AuthService auth) {
    final summary    = _session!['summary'] as Map<String, dynamic>?;
    final dispatches = (_session!['dispatches'] as List? ?? []);
    final truck      = _session!['truck'] as Map<String, dynamic>?;

    final totalRevenue = (summary?['totalRevenue'] as num? ?? 0).toDouble();
    final totalProfit  = (summary?['totalProfit']  as num? ?? 0).toDouble();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Session status bar
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF2E9E4F).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF2E9E4F).withValues(alpha: 0.3)),
        ),
        child: Row(children: [
          const Icon(Icons.circle, color: Color(0xFF2E9E4F), size: 9),
          const SizedBox(width: 8),
          Text('Session Active — ${truck?['name'] ?? ''}',
              style: const TextStyle(color: Color(0xFF2E9E4F), fontWeight: FontWeight.w700, fontSize: 13)),
          const Spacer(),
          Text(
            DateTime.now().toLocal().toString().split(' ')[0],
            style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
          ),
        ]),
      ),
      const SizedBox(height: 14),

      // Revenue / Profit KPIs
      Row(children: [
        Expanded(child: _kpi('Revenue', '₹${totalRevenue.toStringAsFixed(0)}', cs.primary)),
        const SizedBox(width: 10),
        Expanded(child: _kpi('Profit', '₹${totalProfit.toStringAsFixed(0)}', const Color(0xFF2E9E4F))),
      ]),
      const SizedBox(height: 20),

      Text('Loaded Stock', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface)),
      const SizedBox(height: 8),
      Text('Tap a product to record a sale',
          style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.45))),
      const SizedBox(height: 12),

      // Product cards with remaining qty
      ...dispatches.map((d) {
        final product   = d['product'] as Map<String, dynamic>?;
        final productId = d['productId'] as int;
        final dispatched = (d['quantity'] as num).toDouble();
        final remaining  = _remaining(productId);
        final sold       = dispatched - remaining;
        final isEmpty    = remaining <= 0;

        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: isEmpty ? null : () => _showSaleSheet(product, productId, remaining),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(children: [
                Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 26)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(product?['name'] ?? '',
                        style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13,
                          color: isEmpty ? cs.onSurface.withValues(alpha: 0.35) : cs.onSurface,
                        )),
                    const SizedBox(height: 4),
                    Row(children: [
                      _tag('Loaded: ${dispatched.toStringAsFixed(0)}', cs.onSurface.withValues(alpha: 0.4)),
                      const SizedBox(width: 6),
                      _tag('Sold: ${sold.toStringAsFixed(0)}', const Color(0xFF0097A7)),
                    ]),
                  ]),
                ),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(
                    remaining.toStringAsFixed(0),
                    style: TextStyle(
                      fontSize: 24, fontWeight: FontWeight.w800,
                      color: isEmpty ? cs.onSurface.withValues(alpha: 0.3) : cs.primary,
                    ),
                  ),
                  Text('remaining', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.4))),
                  if (!isEmpty)
                    const Icon(Icons.add_circle_rounded, color: Color(0xFF0097A7), size: 18),
                ]),
              ]),
            ),
          ),
        );
      }),

      const SizedBox(height: 24),

      // End Day button
      OutlinedButton.icon(
        onPressed: () async {
          final result = await Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => TruckEndDayScreen(session: _session!),
          ));
          if (result == true) _load();
        },
        icon: const Icon(Icons.nightlight_round_outlined, color: Color(0xFFE65100)),
        label: const Text('End Day & Return Stock', style: TextStyle(color: Color(0xFFE65100))),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFE65100)),
          minimumSize: const Size(double.infinity, 50),
        ),
      ),
      const SizedBox(height: 24),
      _driverCard(cs, auth),
      const SizedBox(height: 20),
    ]);
  }

  // ── Sale bottom sheet ───────────────────────────────────────────────────────

  void _showSaleSheet(Map<String, dynamic>? product, int productId, double remaining) {
    final qtyCtrl   = TextEditingController();
    final priceCtrl = TextEditingController(
        text: (product?['sellingPrice'] as num?)?.toStringAsFixed(0) ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (sheetCtx, setSt) {
          final cs = Theme.of(sheetCtx).colorScheme;
          final qty   = double.tryParse(qtyCtrl.text)   ?? 0;
          final price = double.tryParse(priceCtrl.text) ?? 0;
          final total = qty * price;

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(product?['name'] ?? '',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700))),
                ]),
                const SizedBox(height: 4),
                Text('Available: ${remaining.toStringAsFixed(0)} pcs',
                    style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(
                    child: TextFormField(
                      controller: qtyCtrl,
                      autofocus: true,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(labelText: 'Quantity (pcs)'),
                      onChanged: (_) => setSt(() {}),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: priceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                      decoration: const InputDecoration(labelText: 'Price/pc (₹)'),
                      onChanged: (_) => setSt(() {}),
                    ),
                  ),
                ]),
                if (qty > 0 && price > 0) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: cs.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('Total', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.6), fontSize: 13)),
                      Text('₹${total.toStringAsFixed(2)}',
                          style: TextStyle(color: cs.primary, fontWeight: FontWeight.w800, fontSize: 16)),
                    ]),
                  ),
                ],
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: (qty <= 0 || qty > remaining || price <= 0)
                      ? null
                      : () async {
                          final messenger = ScaffoldMessenger.of(sheetCtx);
                          final token = context.read<AuthService>().token;
                          try {
                            await ApiService.post(
                              '/truck-sessions/${_session!['id']}/sale',
                              {'productId': productId, 'quantity': qty, 'pricePerUnit': price},
                              token: token,
                            );
                            if (!sheetCtx.mounted) return;
                            Navigator.pop(sheetCtx);
                            _load();
                          } catch (e) {
                            messenger.showSnackBar(SnackBar(
                              content: Text(e.toString()),
                              backgroundColor: Colors.red,
                            ));
                          }
                        },
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('Confirm Sale'),
                ),
                if (qty > remaining)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text('Quantity exceeds remaining stock',
                        style: TextStyle(color: Colors.red, fontSize: 12)),
                  ),
              ]),
            ),
          );
        },
      ),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

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
      Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
    ]),
  );

  Widget _tag(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(text, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
  );

  Widget _driverCard(ColorScheme cs, AuthService auth) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: cs.primary.withValues(alpha: 0.07),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(children: [
      CircleAvatar(
        backgroundColor: cs.primary,
        radius: 18,
        child: Text(
          auth.user?.name.isNotEmpty == true ? auth.user!.name[0].toUpperCase() : '?',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(auth.user?.name ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        Text('Truck Driver', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
      ]),
    ]),
  );
}
