import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

// ── Session card ──────────────────────────────────────────────────────────────
class _SessionCard extends StatefulWidget {
  final Map<String, dynamic> session;
  final int index;
  final VoidCallback onTap;
  const _SessionCard({required this.session, required this.index, required this.onTap});

  @override
  State<_SessionCard> createState() => _SessionCardState();
}

class _SessionCardState extends State<_SessionCard> with SingleTickerProviderStateMixin {
  bool _pressed = false;
  late AnimationController _enterCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _enterCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));
    final curve = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOutCubic);
    _fadeAnim  = Tween<double>(begin: 0, end: 1).animate(curve);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero).animate(curve);
    Future.delayed(Duration(milliseconds: widget.index * 60), () {
      if (mounted) _enterCtrl.forward();
    });
  }

  @override
  void dispose() { _enterCtrl.dispose(); super.dispose(); }

  String _fmtDate(String iso) {
    try { return DateFormat('dd MMM  hh:mm a').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }

  @override
  Widget build(BuildContext context) {
    final cs        = Theme.of(context).colorScheme;
    final s         = widget.session;
    final isOpen    = s['status'] == 'OPEN';
    final truck     = s['truck']   as Map<String, dynamic>?;
    final user      = s['user']    as Map<String, dynamic>?;
    final summary   = s['summary'] as Map<String, dynamic>?;
    final dispatches = (s['dispatches'] as List? ?? []);

    // compute totals
    final soldMap = (s['summary']?['soldMap'] as Map?) ?? {};
    final remaining = <int, double>{};
    for (final d in dispatches) {
      final pid        = d['productId'] as int;
      final dispatched = (d['quantity'] as num).toDouble();
      final sold       = (soldMap['$pid'] as num? ?? soldMap[pid] as num? ?? 0).toDouble();
      remaining[pid]   = (dispatched - sold).clamp(0.0, dispatched);
    }

    final totalDispatched = dispatches.fold<double>(0, (a, d) => a + (d['quantity'] as num).toDouble());
    final totalRemaining  = remaining.values.fold<double>(0, (a, v) => a + v);
    final totalSold       = totalDispatched - totalRemaining;
    final revenue         = (summary?['totalRevenue'] as num? ?? 0).toDouble();

    final borderColor = isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F);

    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: GestureDetector(
          onTap: () { HapticFeedback.selectionClick(); widget.onTap(); },
          onTapDown:   (_) => setState(() => _pressed = true),
          onTapUp:     (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            transform: Matrix4.translationValues(_pressed ? 4 : 0, 0, 0),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border(left: BorderSide(color: borderColor, width: 3.5)),
              boxShadow: [BoxShadow(
                color: Colors.black.withValues(alpha: _pressed ? 0.03 : 0.07),
                blurRadius: _pressed ? 4 : 12,
                offset: const Offset(0, 2),
              )],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Header row
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: borderColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                        width: 6, height: 6,
                        decoration: BoxDecoration(color: borderColor, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isOpen ? 'OPEN' : 'CLOSED',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: borderColor, letterSpacing: 0.5),
                      ),
                    ]),
                  ),
                  const Spacer(),
                  Text(
                    _fmtDate(s['date'] as String? ?? ''),
                    style: TextStyle(fontSize: 10.5, color: cs.onSurface.withValues(alpha: 0.45)),
                  ),
                ]),
                const SizedBox(height: 9),
                // Truck + driver
                Row(children: [
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      color: borderColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.local_shipping_rounded, color: borderColor, size: 21),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(truck?['name'] ?? 'Unknown Truck',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text('Driver: ${user?['name'] ?? ''}',
                        style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
                  ])),
                  Icon(Icons.chevron_right_rounded, color: cs.onSurface.withValues(alpha: 0.3), size: 20),
                ]),
                const SizedBox(height: 10),
                // Stat chips
                Row(children: [
                  _stat('Loaded',  totalDispatched.toStringAsFixed(0), const Color(0xFF607D8B)),
                  const SizedBox(width: 6),
                  _stat('Sold',    totalSold.toStringAsFixed(0),       const Color(0xFF0097A7)),
                  const SizedBox(width: 6),
                  if (isOpen) ...[
                    _stat('Left', totalRemaining.toStringAsFixed(0),   const Color(0xFFFB8C00)),
                    const SizedBox(width: 6),
                  ],
                  _stat('Revenue', '₹${revenue.toStringAsFixed(0)}',        const Color(0xFF2E9E4F)),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _stat(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.75))),
        const SizedBox(height: 1),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color),
            maxLines: 1, overflow: TextOverflow.ellipsis),
      ]),
    ),
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
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
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final query   = _statusFilter == 'ALL' ? '' : '?status=$_statusFilter';
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
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showStartSheet(context, auth),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Start Session'),
        backgroundColor: cs.primary,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      body: Column(children: [
        // Filter chips
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: cs.surface,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2))],
          ),
          child: Row(children: [
            _chip('All',    'ALL',    cs),
            const SizedBox(width: 8),
            _chip('Open',   'OPEN',   cs),
            const SizedBox(width: 8),
            _chip('Closed', 'CLOSED', cs),
          ]),
        ),
        // Session list
        Expanded(
          child: _loading
              ? _buildSkeleton()
              : _sessions.isEmpty
                  ? _emptyState(cs)
                  : RefreshIndicator(
                      onRefresh: () async { HapticFeedback.mediumImpact(); await _load(); },
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                        itemCount: _sessions.length,
                        itemBuilder: (_, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _SessionCard(
                            session: _sessions[i] as Map<String, dynamic>,
                            index: i,
                            onTap: () => _showDetailSheet(context, _sessions[i] as Map<String, dynamic>, auth),
                          ),
                        ),
                      ),
                    ),
        ),
      ]),
    );
  }

  Widget _emptyState(ColorScheme cs) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.local_shipping_outlined, size: 52, color: cs.onSurface.withValues(alpha: 0.18)),
      const SizedBox(height: 12),
      Text(
        _statusFilter == 'ALL' ? 'No sessions yet' : 'No ${_statusFilter.toLowerCase()} sessions',
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.35)),
      ),
      const SizedBox(height: 4),
      Text('Tap + to start a session', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.25))),
    ]),
  );

  Widget _buildSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: 4,
      itemBuilder: (_, __) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          height: 120,
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border(left: BorderSide(color: Colors.grey.withValues(alpha: 0.2), width: 3.5)),
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, String value, ColorScheme cs) {
    final selected  = _statusFilter == value;
    final count     = value == 'ALL' ? _sessions.length : _sessions.where((s) => s['status'] == value).length;
    final chipColor = value == 'OPEN' ? const Color(0xFFFB8C00) : value == 'CLOSED' ? const Color(0xFF2E9E4F) : cs.primary;
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); setState(() => _statusFilter = value); _load(); },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? chipColor : chipColor.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? chipColor : chipColor.withValues(alpha: 0.28)),
          boxShadow: selected ? [BoxShadow(color: chipColor.withValues(alpha: 0.28), blurRadius: 8, offset: const Offset(0, 3))] : null,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : chipColor)),
          const SizedBox(width: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: selected ? Colors.white.withValues(alpha: 0.25) : chipColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('$count', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }

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
              'ctrl':      TextEditingController(),
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
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(children: [
                    Center(child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
                    )),
                    const SizedBox(height: 14),
                    Row(children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.local_shipping_rounded, color: cs.primary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text('Start Truck Session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 14),
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
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Column(children: [
                            Icon(Icons.inventory_2_outlined, size: 36, color: cs.onSurface.withValues(alpha: 0.2)),
                            const SizedBox(height: 8),
                            Center(child: Text('Tap "Add" to add products',
                                style: TextStyle(color: cs.onSurface.withValues(alpha: 0.4), fontSize: 13))),
                          ]),
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
                          .where((i) => (double.tryParse((i['ctrl'] as TextEditingController).text) ?? 0) > 0)
                          .map((i) => {
                            'productId': i['productId'],
                            'quantity':  double.parse((i['ctrl'] as TextEditingController).text),
                          }).toList();
                      if (dispatches.isEmpty) return;
                      final messenger = ScaffoldMessenger.of(ctx);
                      try {
                        await ApiService.post('/truck-sessions/start', {
                          'truckId':    selectedTruckId,
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: cs.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
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
    final truck      = s['truck']   as Map<String, dynamic>?;
    final user       = s['user']    as Map<String, dynamic>?;
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
          initialChildSize: 0.78,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          builder: (_, ctrl) => Container(
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: ListView(controller: ctrl, padding: const EdgeInsets.fromLTRB(20, 0, 20, 30), children: [
              // Handle
              const SizedBox(height: 12),
              Center(child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
              )),
              const SizedBox(height: 18),

              // Truck + status header
              Row(children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: (isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F)).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.local_shipping_rounded,
                      color: isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(truck?['name'] ?? '', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  Text('Driver: ${user?['name'] ?? ''}',
                      style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: (isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F)).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: (isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F)).withValues(alpha: 0.35)),
                  ),
                  child: Text(isOpen ? 'OPEN' : 'CLOSED',
                      style: TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 11,
                        color: isOpen ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F),
                        letterSpacing: 0.5,
                      )),
                ),
              ]),
              const SizedBox(height: 18),

              // KPIs
              Row(children: [
                _detailKpi('Revenue', '₹${((summary?['totalRevenue'] as num?) ?? 0).toStringAsFixed(0)}', cs.primary),
                const SizedBox(width: 10),
                _detailKpi('Profit',  '₹${((summary?['totalProfit']  as num?) ?? 0).toStringAsFixed(0)}', const Color(0xFF2E9E4F)),
              ]),
              const SizedBox(height: 18),

              // Dispatched
              _sectionTitle('Dispatched Stock', cs),
              const SizedBox(height: 6),
              ...dispatches.map((d) {
                final product = d['product'] as Map<String, dynamic>?;
                final pid     = d['productId'] as int;
                final loaded  = (d['quantity'] as num).toDouble();
                final rem     = remaining[pid] ?? 0;
                final sold    = loaded - rem;
                return _stockRow(product, loaded, sold, rem, isOpen, cs);
              }),

              if (returns.isNotEmpty) ...[
                const SizedBox(height: 14),
                _sectionTitle('Returned Stock', cs),
                const SizedBox(height: 6),
                ...returns.map((r) {
                  final product = r['product'] as Map<String, dynamic>?;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)),
                        child: Center(child: Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 16))),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(product?['name'] ?? '', style: const TextStyle(fontSize: 13))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                        child: Text('${(r['quantity'] as num).toStringAsFixed(0)} pcs',
                            style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary, fontSize: 12)),
                      ),
                    ]),
                  );
                }),
              ],

              // Close button
              if (isOpen) ...[
                const SizedBox(height: 22),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showCloseSheet(ctx, s, auth, remaining);
                  },
                  icon: const Icon(Icons.nightlight_round_outlined),
                  label: const Text('Close Session'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE65100),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                ),
              ],
            ]),
          ),
        );
      },
    );
  }

  // ── Close Session sheet ──────────────────────────────────────────────────────

  void _showCloseSheet(BuildContext ctx, Map<String, dynamic> s, AuthService auth,
      Map<int, double> remaining) {
    final dispatches = (s['dispatches'] as List? ?? []);
    final items = dispatches.map((d) {
      final pid = d['productId'] as int;
      final rem = remaining[pid] ?? 0;
      return {
        'productId':   pid,
        'productName': (d['product']?['name'] as String?) ?? '',
        'emoji':       (d['product']?['emoji'] as String?) ?? '🍦',
        'remaining':   rem,
        'ctrl':        TextEditingController(text: rem > 0 ? rem.toStringAsFixed(0) : ''),
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
                Row(children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: const Color(0xFFE65100).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.nightlight_round_outlined, color: Color(0xFFE65100), size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Text('Close Session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 6),
                Text('Verify and enter actual returned quantities.',
                    style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 16),
                ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(9)),
                      child: Center(child: Text(item['emoji'] as String, style: const TextStyle(fontSize: 18))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(item['productName'] as String,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      Text('Expected: ${(item['remaining'] as double).toStringAsFixed(0)} pcs',
                          style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.45))),
                    ])),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 80,
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
                          'quantity':  double.tryParse((i['ctrl'] as TextEditingController).text) ?? 0.0,
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
                        content: Text('Session closed successfully'),
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
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
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

  Widget _sectionTitle(String title, ColorScheme cs) => Row(children: [
    Container(width: 3, height: 14, decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 8),
    Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
  ]);

  Widget _detailKpi(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.75))),
        const SizedBox(height: 3),
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
      ]),
    ),
  );

  Widget _stockRow(Map<String, dynamic>? product, double loaded, double sold,
      double rem, bool isOpen, ColorScheme cs) {
    final progress = loaded > 0 ? (sold / loaded).clamp(0.0, 1.0) : 0.0;
    const soldColor = Color(0xFF0097A7);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 34, height: 34,
          decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(9)),
          child: Center(child: Text(product?['emoji'] ?? '🍦', style: const TextStyle(fontSize: 17))),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(product?['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutCubic,
              builder: (_, v, __) => LinearProgressIndicator(
                value: v,
                backgroundColor: soldColor.withValues(alpha: 0.1),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0097A7)),
                minHeight: 4,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(children: [
            Text('${loaded.toStringAsFixed(0)} loaded',
                style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.4))),
            const SizedBox(width: 8),
            Text('${sold.toStringAsFixed(0)} sold',
                style: const TextStyle(fontSize: 10, color: Color(0xFF0097A7), fontWeight: FontWeight.w600)),
            if (isOpen) ...[
              const SizedBox(width: 8),
              Text('${rem.toStringAsFixed(0)} left',
                  style: TextStyle(fontSize: 10, color: cs.primary, fontWeight: FontWeight.w700)),
            ],
          ]),
        ])),
      ]),
    );
  }
}
