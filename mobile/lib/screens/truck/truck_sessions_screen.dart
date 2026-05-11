import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

class TruckSessionsScreen extends StatefulWidget {
  const TruckSessionsScreen({super.key});
  @override
  State<TruckSessionsScreen> createState() => _TruckSessionsScreenState();
}

class _TruckSessionsScreenState extends State<TruckSessionsScreen> {
  List<dynamic> _sessions  = [];
  List<dynamic> _trucks    = [];
  List<dynamic> _products  = [];
  bool _loading = true;
  String _statusFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() { _loading = true; });
    try {
      final query = _statusFilter == 'ALL' ? '' : '?status=$_statusFilter';
      final results = await Future.wait([
        ApiService.get('/truck-sessions$query', token: auth.token),
        ApiService.get('/trucks',               token: auth.token),
        ApiService.get('/products',             token: auth.token),
      ]);
      setState(() {
        _sessions = results[0] as List;
        _trucks   = (results[1] as List).where((t) => t['isActive'] == true).toList();
        _products = (results[2] as List).where((p) => p['isActive'] == true).toList();
      });
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  String _fmtDate(String iso) {
    try { return DateFormat('dd MMM  hh:mm a').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }

  // Per-product remaining = dispatched - sold
  Map<int, double> _remainingMap(Map<String, dynamic> s) {
    final soldMap    = (s['summary']?['soldMap'] as Map?) ?? {};
    final dispatches = (s['dispatches'] as List? ?? []);
    final result     = <int, double>{};
    for (final d in dispatches) {
      final pid        = d['productId'] as int;
      final dispatched = (d['quantity'] as num).toDouble();
      final sold       = (soldMap['$pid'] as num? ?? soldMap[pid] as num? ?? 0).toDouble();
      result[pid]      = (dispatched - sold).clamp(0.0, dispatched);
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Truck Sessions'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showStartSheet(context, auth),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Start Session'),
      ),
      body: Column(children: [
        // Filter chips
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: cs.surface,
          child: Row(children: [
            _chip('All',    'ALL',    cs),
            const SizedBox(width: 8),
            _chip('Open',   'OPEN',   cs),
            const SizedBox(width: 8),
            _chip('Closed', 'CLOSED', cs),
          ]),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _sessions.isEmpty
                  ? const Center(child: Text('No sessions found', style: TextStyle(color: Color(0xFF607D8B))))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _sessions.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _sessionCard(_sessions[i], cs, auth),
                      ),
                    ),
        ),
      ]),
    );
  }

  Widget _chip(String label, String value, ColorScheme cs) {
    final selected = _statusFilter == value;
    return GestureDetector(
      onTap: () { setState(() => _statusFilter = value); _load(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? cs.primary : cs.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: TextStyle(
          color: selected ? Colors.white : cs.onSurface,
          fontSize: 12, fontWeight: FontWeight.w600,
        )),
      ),
    );
  }

  Widget _sessionCard(Map<String, dynamic> s, ColorScheme cs, AuthService auth) {
    final isOpen     = s['status'] == 'OPEN';
    final truck      = s['truck']  as Map<String, dynamic>?;
    final user       = s['user']   as Map<String, dynamic>?;
    final summary    = s['summary'] as Map<String, dynamic>?;
    final dispatches = (s['dispatches'] as List? ?? []);
    final remaining  = _remainingMap(s);

    final totalDispatched = dispatches.fold<double>(0, (a, d) => a + (d['quantity'] as num).toDouble());
    final totalRemaining  = remaining.values.fold<double>(0, (a, v) => a + v);
    final totalSold       = totalDispatched - totalRemaining;
    final revenue         = (summary?['totalRevenue'] as num? ?? 0).toDouble();

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showDetailSheet(context, s, auth),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Status + date row
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isOpen
                      ? const Color(0xFF2E9E4F).withValues(alpha: 0.12)
                      : Colors.grey.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isOpen ? '● OPEN' : '✓ CLOSED',
                  style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700,
                    color: isOpen ? const Color(0xFF2E9E4F) : Colors.grey,
                  ),
                ),
              ),
              const Spacer(),
              Text(_fmtDate(s['date'] as String? ?? ''),
                  style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
            ]),
            const SizedBox(height: 8),
            Text(truck?['name'] ?? 'Unknown Truck',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            Text('Driver: ${user?['name'] ?? ''}',
                style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 10),
            // Stats row
            Row(children: [
              _statChip('Loaded', '${totalDispatched.toStringAsFixed(0)} pcs', cs.onSurface.withValues(alpha: 0.5)),
              const SizedBox(width: 8),
              _statChip('Sold', '${totalSold.toStringAsFixed(0)} pcs', const Color(0xFF0097A7)),
              const SizedBox(width: 8),
              if (isOpen)
                _statChip('Left', '${totalRemaining.toStringAsFixed(0)} pcs', cs.primary),
              _statChip('Revenue', '₹${revenue.toStringAsFixed(0)}', const Color(0xFF2E9E4F)),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _statChip(String label, String val, Color color) => Expanded(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(fontSize: 9, color: color.withValues(alpha: 0.7))),
      Text(val, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
    ]),
  );

  // ── Start Session sheet ──────────────────────────────────────────────────────

  void _showStartSheet(BuildContext ctx, AuthService auth) {
    int? selectedTruckId = _trucks.isNotEmpty ? _trucks[0]['id'] as int : null;
    final List<Map<String, dynamic>> items = [];

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (sheetCtx, setSt) {
          final cs = Theme.of(sheetCtx).colorScheme;

          void addItem() {
            if (_products.isEmpty) return;
            setSt(() => items.add({
              'productId': _products[0]['id'] as int,
              'ctrl': TextEditingController(),
            }));
          }

          return DraggableScrollableSheet(
            initialChildSize: 0.85,
            maxChildSize: 0.95,
            minChildSize: 0.5,
            builder: (_, scrollCtrl) => Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(children: [
                // Handle + title
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(children: [
                    Center(child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
                    )),
                    const SizedBox(height: 14),
                    const Align(alignment: Alignment.centerLeft,
                        child: Text('Start Truck Session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
                    const SizedBox(height: 14),
                    // Truck picker
                    DropdownButtonFormField<int>(
                      initialValue: selectedTruckId,
                      decoration: const InputDecoration(labelText: 'Select Truck', isDense: true),
                      items: _trucks.map<DropdownMenuItem<int>>((t) =>
                          DropdownMenuItem(value: t['id'] as int, child: Text(t['name'] as String))).toList(),
                      onChanged: (v) => setSt(() => selectedTruckId = v),
                    ),
                    const SizedBox(height: 14),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Products to Load', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      TextButton.icon(
                        onPressed: addItem,
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text('Add'),
                      ),
                    ]),
                  ]),
                ),
                Expanded(
                  child: ListView(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      if (items.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: Text('Tap "Add" to add products',
                              style: TextStyle(color: cs.onSurface.withValues(alpha: 0.4), fontSize: 13))),
                        ),
                      ...items.asMap().entries.map((e) {
                        final i    = e.key;
                        final item = e.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(children: [
                            Expanded(
                              flex: 3,
                              child: DropdownButtonFormField<int>(
                                initialValue: item['productId'] as int,
                                isExpanded: true,
                                decoration: const InputDecoration(labelText: 'Product', isDense: true),
                                items: _products.map<DropdownMenuItem<int>>((p) => DropdownMenuItem(
                                  value: p['id'] as int,
                                  child: Text('${p['emoji'] ?? '🍦'} ${p['name']}',
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12)),
                                )).toList(),
                                onChanged: (v) => setSt(() => items[i]['productId'] = v),
                              ),
                            ),
                            const SizedBox(width: 10),
                            SizedBox(
                              width: 72,
                              child: TextFormField(
                                controller: item['ctrl'] as TextEditingController,
                                keyboardType: TextInputType.number,
                                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, color: Colors.red, size: 20),
                              onPressed: () => setSt(() => items.removeAt(i)),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ]),
                        );
                      }),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(sheetCtx).viewInsets.bottom + 20),
                  child: ElevatedButton.icon(
                    onPressed: (selectedTruckId == null || items.isEmpty) ? null : () async {
                      final dispatches = items
                          .where((i) {
                            final q = double.tryParse((i['ctrl'] as TextEditingController).text) ?? 0;
                            return q > 0;
                          })
                          .map((i) => {
                            'productId': i['productId'],
                            'quantity': double.parse((i['ctrl'] as TextEditingController).text),
                          })
                          .toList();
                      if (dispatches.isEmpty) return;
                      final messenger = ScaffoldMessenger.of(ctx);
                      try {
                        await ApiService.post('/truck-sessions/start', {
                          'truckId': selectedTruckId,
                          'dispatches': dispatches,
                        }, token: auth.token);
                        if (!sheetCtx.mounted) return;
                        Navigator.pop(sheetCtx);
                        _load();
                      } catch (e) {
                        messenger.showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                      }
                    },
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Start Session'),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  // ── Session Detail sheet ─────────────────────────────────────────────────────

  void _showDetailSheet(BuildContext ctx, Map<String, dynamic> s, AuthService auth) {
    final isOpen     = s['status'] == 'OPEN';
    final truck      = s['truck']  as Map<String, dynamic>?;
    final user       = s['user']   as Map<String, dynamic>?;
    final summary    = s['summary'] as Map<String, dynamic>?;
    final dispatches = (s['dispatches'] as List? ?? []);
    final returns    = (s['returns']    as List? ?? []);
    final remaining  = _remainingMap(s);

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        final cs = Theme.of(ctx).colorScheme;
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          builder: (_, ctrl) => Container(
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.all(20),
            child: ListView(controller: ctrl, children: [
              Center(child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
              )),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(truck?['name'] ?? '', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  Text('Driver: ${user?['name'] ?? ''}',
                      style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isOpen
                        ? const Color(0xFF2E9E4F).withValues(alpha: 0.12)
                        : Colors.grey.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(isOpen ? '● OPEN' : '✓ CLOSED',
                      style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 12,
                        color: isOpen ? const Color(0xFF2E9E4F) : Colors.grey,
                      )),
                ),
              ]),
              const SizedBox(height: 16),

              // KPIs
              Row(children: [
                _detailKpi('Revenue', '₹${((summary?['totalRevenue'] as num?) ?? 0).toStringAsFixed(0)}', cs.primary),
                const SizedBox(width: 10),
                _detailKpi('Profit', '₹${((summary?['totalProfit'] as num?) ?? 0).toStringAsFixed(0)}', const Color(0xFF2E9E4F)),
              ]),
              const SizedBox(height: 16),

              // Dispatched with remaining
              _sectionTitle('Dispatched Stock', cs),
              ...dispatches.map((d) {
                final product  = d['product'] as Map<String, dynamic>?;
                final pid      = d['productId'] as int;
                final loaded   = (d['quantity'] as num).toDouble();
                final rem      = remaining[pid] ?? 0;
                final sold     = loaded - rem;
                return _stockRow(product, loaded, sold, rem, isOpen, cs);
              }),

              if (returns.isNotEmpty) ...[
                const SizedBox(height: 12),
                _sectionTitle('Returned Stock', cs),
                ...returns.map((r) {
                  final product = r['product'] as Map<String, dynamic>?;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(children: [
                      Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(product?['name'] ?? '', style: const TextStyle(fontSize: 13))),
                      Text('${(r['quantity'] as num).toStringAsFixed(0)} pcs',
                          style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
                    ]),
                  );
                }),
              ],

              // Close button (only if open)
              if (isOpen) ...[
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showCloseSheet(ctx, s, auth, remaining);
                  },
                  icon: const Icon(Icons.nightlight_round_outlined, color: Color(0xFFE65100)),
                  label: const Text('Close Session', style: TextStyle(color: Color(0xFFE65100))),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE65100)),
                    minimumSize: const Size(double.infinity, 46),
                  ),
                ),
              ],
            ]),
          ),
        );
      },
    );
  }

  // ── Close Session sheet (admin/BM with correction) ───────────────────────────

  void _showCloseSheet(BuildContext ctx, Map<String, dynamic> s, AuthService auth,
      Map<int, double> remaining) {
    final dispatches = (s['dispatches'] as List? ?? []);
    final items = dispatches.map((d) {
      final pid = d['productId'] as int;
      final rem = remaining[pid] ?? 0;
      return {
        'productId': pid,
        'productName': (d['product']?['name'] as String?) ?? '',
        'emoji': (d['product']?['emoji'] as String?) ?? '🍦',
        'remaining': rem,
        'ctrl': TextEditingController(text: rem > 0 ? rem.toStringAsFixed(0) : ''),
      };
    }).toList();

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
                const Text('Close Session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text('Verify and enter actual returned quantities.',
                    style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 16),
                ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(children: [
                    Text(item['emoji'] as String, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(child: Text(item['productName'] as String,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                    Text('Expected: ${(item['remaining'] as double).toStringAsFixed(0)}',
                        style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.45))),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 72,
                      child: TextFormField(
                        controller: item['ctrl'] as TextEditingController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        textAlign: TextAlign.center,
                        decoration: const InputDecoration(labelText: 'Actual', isDense: true,
                            contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 10)),
                      ),
                    ),
                  ]),
                )),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () async {
                    final returns = items
                        .map((i) => {
                              'productId': i['productId'],
                              'quantity': double.tryParse((i['ctrl'] as TextEditingController).text) ?? 0.0,
                            })
                        .where((r) => (r['quantity'] as double) > 0)
                        .toList();
                    final messenger = ScaffoldMessenger.of(ctx);
                    try {
                      await ApiService.put(
                        '/truck-sessions/${s['id']}/close',
                        {'returns': returns},
                        token: auth.token,
                      );
                      if (!sheetCtx.mounted) return;
                      Navigator.pop(sheetCtx);
                      _load();
                      messenger.showSnackBar(const SnackBar(
                        content: Text('Session closed'),
                        backgroundColor: Color(0xFF2E9E4F),
                      ));
                    } catch (e) {
                      messenger.showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline_rounded),
                  label: const Text('Confirm & Close'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E9E4F),
                    minimumSize: const Size(double.infinity, 48),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  Widget _sectionTitle(String title, ColorScheme cs) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
  );

  Widget _detailKpi(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.7))),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
      ]),
    ),
  );

  Widget _stockRow(Map<String, dynamic>? product, double loaded, double sold,
      double remaining, bool isOpen, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(children: [
        Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 8),
        Expanded(child: Text(product?['name'] ?? '', style: const TextStyle(fontSize: 13))),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${loaded.toStringAsFixed(0)} loaded',
              style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.45))),
          Text('${sold.toStringAsFixed(0)} sold',
              style: const TextStyle(fontSize: 10, color: Color(0xFF0097A7), fontWeight: FontWeight.w600)),
          if (isOpen)
            Text('${remaining.toStringAsFixed(0)} left',
                style: TextStyle(fontSize: 10, color: cs.primary, fontWeight: FontWeight.w700)),
        ]),
      ]),
    );
  }
}
