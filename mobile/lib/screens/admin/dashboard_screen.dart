import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

// Matches web thresholds
const _kLowThreshold = 20.0;

String _stockCat(double v) {
  if (v <= 0) return 'out';
  if (v <= _kLowThreshold) return 'low';
  return 'ok';
}

// ── Animated section wrapper ───────────────────────────────────────────────────
class _Entrance extends StatelessWidget {
  final Widget child;
  final Animation<double> ctrl;
  final double begin;
  final double end;
  const _Entrance({required this.child, required this.ctrl, required this.begin, required this.end});

  @override
  Widget build(BuildContext context) {
    final anim = CurvedAnimation(parent: ctrl, curve: Interval(begin, end, curve: Curves.easeOutCubic));
    return AnimatedBuilder(
      animation: anim,
      child: child,
      builder: (_, w) => Opacity(
        opacity: anim.value.clamp(0.0, 1.0),
        child: Transform.translate(offset: Offset(0, 22 * (1 - anim.value)), child: w),
      ),
    );
  }
}

// ── Animated KPI card ─────────────────────────────────────────────────────────
class _KpiCard extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  final IconData icon;
  final String prefix;
  final String suffix;
  final Animation<double> ctrl;
  final double begin;

  const _KpiCard({
    required this.label, required this.value, required this.color,
    required this.icon,  required this.ctrl,  required this.begin,
    this.prefix = '', this.suffix = '',
  });

  @override
  Widget build(BuildContext context) {
    final anim = CurvedAnimation(parent: ctrl, curve: Interval(begin, (begin + 0.35).clamp(0, 1), curve: Curves.easeOutCubic));
    return AnimatedBuilder(
      animation: anim,
      builder: (_, __) {
        final v = value * anim.value;
        final display = suffix.isNotEmpty
            ? '$prefix${v.toStringAsFixed(1)}$suffix'
            : '$prefix${v.toStringAsFixed(0)}';
        return Opacity(
          opacity: anim.value.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, 18 * (1 - anim.value)),
            child: Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.22)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Icon(icon, color: color, size: 18),
                  const Spacer(),
                  Container(
                    width: 6, height: 6,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                ]),
                const SizedBox(height: 10),
                Text(label, style: TextStyle(fontSize: 10.5, color: color.withValues(alpha: 0.75), fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                const SizedBox(height: 4),
                Text(display, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color, height: 1.1)),
              ]),
            ),
          ),
        );
      },
    );
  }
}

// ── Mini stock tile ───────────────────────────────────────────────────────────
class _MiniTile extends StatefulWidget {
  final int count;
  final String label;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  const _MiniTile({required this.count, required this.label, required this.color, required this.active, required this.onTap});

  @override
  State<_MiniTile> createState() => _MiniTileState();
}

class _MiniTileState extends State<_MiniTile> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: widget.onTap,
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp:   (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutBack,
          transform: Matrix4.translationValues(0, _pressed ? 2 : (widget.active ? -3 : 0), 0),
          transformAlignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: widget.active ? 0.15 : 0.08),
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: widget.color.withValues(alpha: widget.active ? 0.6 : 0.18),
              width: widget.active ? 1.5 : 1,
            ),
            boxShadow: widget.active ? [BoxShadow(color: widget.color.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 3))] : null,
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${widget.count}', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: widget.color, height: 1)),
            const SizedBox(height: 3),
            Text(widget.label, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: widget.color.withValues(alpha: 0.8), letterSpacing: 0.2), maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
      ),
    );
  }
}

// ── Stock row card ────────────────────────────────────────────────────────────
class _StockRow extends StatefulWidget {
  final Map<String, dynamic> item;
  final double maxStock;
  final int index;
  final Animation<double> ctrl;
  const _StockRow({required this.item, required this.maxStock, required this.index, required this.ctrl});

  @override
  State<_StockRow> createState() => _StockRowState();
}

class _StockRowState extends State<_StockRow> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final cs     = Theme.of(context).colorScheme;
    final inHand = (widget.item['inHand'] as num? ?? 0).toDouble();
    final cat    = _stockCat(inHand);
    final color  = cat == 'out' ? const Color(0xFFE53935) : cat == 'low' ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F);
    final prog   = widget.maxStock > 0 ? (inHand.clamp(0, widget.maxStock) / widget.maxStock) : 0.0;
    final name   = widget.item['productName'] ?? widget.item['name'] ?? '';
    final delay  = (0.5 + widget.index * 0.06).clamp(0.0, 0.95);

    return _Entrance(
      ctrl: widget.ctrl,
      begin: delay,
      end: (delay + 0.3).clamp(0, 1),
      child: GestureDetector(
        onTapDown:   (_) => setState(() => _pressed = true),
        onTapUp:     (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.only(bottom: 8),
          transform: Matrix4.translationValues(_pressed ? 4 : 0, 0, 0),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border(left: BorderSide(color: color, width: 3.5)),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: _pressed ? 0.03 : 0.06), blurRadius: _pressed ? 4 : 10, offset: const Offset(0, 2))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Text(widget.item['emoji'] ?? '🍦', style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: prog),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, __) => LinearProgressIndicator(
                      value: v,
                      backgroundColor: color.withValues(alpha: 0.12),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 4,
                    ),
                  ),
                ),
              ])),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(inHand.toStringAsFixed(0), style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color, height: 1)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                  child: Text(
                    cat == 'out' ? 'Out' : cat == 'low' ? 'Low' : 'OK',
                    style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700),
                  ),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  String _stockFilter = 'all';
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
    _load();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    _ctrl.reset();
    try {
      final token = context.read<AuthService>().token;
      final month = DateFormat('yyyy-MM').format(DateTime.now());
      final results = await Future.wait([
        ApiService.get('/reports/monthly?month=$month', token: token),
        ApiService.get('/reports/stock',                token: token),
      ]);
      if (mounted) {
        final monthly = results[0] as Map<String, dynamic>;
        setState(() => _data = {'summary': monthly['summary'], 'stock': results[1]});
        _ctrl.forward();
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> get _stock       => (_data?['stock'] as List? ?? []);
  List<dynamic> get _filteredStock {
    return switch (_stockFilter) {
      'ok'  => _stock.where((s) => (s['inHand'] as num? ?? 0) > _kLowThreshold).toList(),
      'low' => _stock.where((s) { final v = (s['inHand'] as num? ?? 0).toDouble(); return v > 0 && v <= _kLowThreshold; }).toList(),
      'out' => _stock.where((s) => (s['inHand'] as num? ?? 0) <= 0).toList(),
      _     => _stock,
    };
  }

  int _count(String cat) => switch (cat) {
    'ok'  => _stock.where((s) => (s['inHand'] as num? ?? 0) > _kLowThreshold).length,
    'low' => _stock.where((s) { final v = (s['inHand'] as num? ?? 0).toDouble(); return v > 0 && v <= _kLowThreshold; }).length,
    'out' => _stock.where((s) => (s['inHand'] as num? ?? 0) <= 0).length,
    _     => _stock.length,
  };

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    final firstName = (auth.user?.name ?? '').split(' ').first;

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
          ? _buildSkeleton(cs)
          : _error != null && _data == null
              ? _buildError(cs)
              : RefreshIndicator(
              onRefresh: () async { HapticFeedback.mediumImpact(); await _load(); },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                  // ── Greeting ──
                  _Entrance(ctrl: _ctrl, begin: 0, end: 0.35,
                    child: _buildGreeting(greeting, firstName, cs)),
                  const SizedBox(height: 22),

                  // ── KPI cards ──
                  if (_data != null) ...[
                    _Entrance(ctrl: _ctrl, begin: 0.05, end: 0.35,
                      child: _sectionHeader('This Month', cs)),
                    const SizedBox(height: 10),
                    _buildKpiGrid(cs),
                    const SizedBox(height: 26),

                    // ── Stock section ──
                    _Entrance(ctrl: _ctrl, begin: 0.38, end: 0.65,
                      child: _sectionHeader('Stock Status', cs)),
                    const SizedBox(height: 10),
                    _Entrance(ctrl: _ctrl, begin: 0.4, end: 0.68,
                      child: _buildFilterChips()),
                    const SizedBox(height: 10),
                    _Entrance(ctrl: _ctrl, begin: 0.42, end: 0.7,
                      child: _buildMiniTiles()),
                    const SizedBox(height: 12),
                    _buildStockList(),
                  ],
                ]),
              ),
            ),
    );
  }

  // ── Greeting widget ──────────────────────────────────────────────────────────
  Widget _buildGreeting(String greeting, String firstName, ColorScheme cs) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      ShaderMask(
        shaderCallback: (b) => const LinearGradient(colors: [Color(0xFF0097A7), Color(0xFF00BFA5)]).createShader(b),
        child: Text('$greeting, $firstName',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
      ),
      const SizedBox(height: 4),
      Text(DateFormat('EEEE, d MMMM y').format(DateTime.now()),
          style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
    ]);
  }

  // ── Section header ───────────────────────────────────────────────────────────
  Widget _sectionHeader(String title, ColorScheme cs) {
    return Row(children: [
      Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
      const SizedBox(width: 10),
      Expanded(child: Container(height: 1, decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cs.outline.withValues(alpha: 0.4), Colors.transparent]),
      ))),
    ]);
  }

  // ── KPI grid ─────────────────────────────────────────────────────────────────
  Widget _buildKpiGrid(ColorScheme cs) {
    final s        = _data!['summary'];
    final revenue  = (s?['totalRevenue']  as num? ?? 0).toDouble();
    final profit   = (s?['netProfit']     as num? ?? 0).toDouble();
    final expenses = (s?['totalExpenses'] as num? ?? 0).toDouble();
    final margin   = revenue > 0 ? profit / revenue * 100 : 0.0;

    return Column(children: [
      Row(children: [
        Expanded(child: _KpiCard(label: 'Revenue',  value: revenue,  color: const Color(0xFF0097A7), icon: Icons.currency_rupee_rounded, prefix: '₹', ctrl: _ctrl, begin: 0.12)),
        const SizedBox(width: 12),
        Expanded(child: _KpiCard(label: 'Net Profit', value: profit,  color: const Color(0xFF2E9E4F), icon: Icons.trending_up_rounded,  prefix: '₹', ctrl: _ctrl, begin: 0.18)),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _KpiCard(label: 'Expenses', value: expenses, color: const Color(0xFF5C6BC0), icon: Icons.receipt_long_rounded,   prefix: '₹', ctrl: _ctrl, begin: 0.24)),
        const SizedBox(width: 12),
        Expanded(child: _KpiCard(label: 'Margin',   value: margin,  color: const Color(0xFFFB8C00), icon: Icons.percent_rounded,        suffix: '%', ctrl: _ctrl, begin: 0.30)),
      ]),
    ]);
  }

  // ── Filter chips ─────────────────────────────────────────────────────────────
  static const _filters = [
    ('all', 'All',         Color(0xFF0097A7)),
    ('ok',  'In Stock',    Color(0xFF2E9E4F)),
    ('low', 'Low Stock',   Color(0xFFFB8C00)),
    ('out', 'Out of Stock',Color(0xFFE53935)),
  ];

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _filters.map((f) {
          final isActive = _stockFilter == f.$1;
          final color    = f.$3;
          final count    = _count(f.$1);
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () { HapticFeedback.selectionClick(); setState(() => _stockFilter = f.$1); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: isActive ? color : color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isActive ? color : color.withValues(alpha: 0.3)),
                  boxShadow: isActive ? [BoxShadow(color: color.withValues(alpha: 0.28), blurRadius: 8, offset: const Offset(0, 3))] : null,
                ),
                child: Row(children: [
                  Text(f.$2, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : color)),
                  const SizedBox(width: 5),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.white.withValues(alpha: 0.25) : color,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('$count', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ]),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Mini tiles ───────────────────────────────────────────────────────────────
  Widget _buildMiniTiles() {
    return Row(children: [
      _MiniTile(count: _count('ok'),  label: 'In Stock',     color: const Color(0xFF2E9E4F), active: _stockFilter == 'ok',  onTap: () { HapticFeedback.selectionClick(); setState(() => _stockFilter = 'ok');  }),
      const SizedBox(width: 10),
      _MiniTile(count: _count('low'), label: 'Low Stock',    color: const Color(0xFFFB8C00), active: _stockFilter == 'low', onTap: () { HapticFeedback.selectionClick(); setState(() => _stockFilter = 'low'); }),
      const SizedBox(width: 10),
      _MiniTile(count: _count('out'), label: 'Out of Stock', color: const Color(0xFFE53935), active: _stockFilter == 'out', onTap: () { HapticFeedback.selectionClick(); setState(() => _stockFilter = 'out'); }),
    ]);
  }

  // ── Stock list ───────────────────────────────────────────────────────────────
  Widget _buildStockList() {
    final items    = _filteredStock;
    final maxStock = _stock.fold<double>(1, (m, s) => (s['inHand'] as num? ?? 0).toDouble() > m ? (s['inHand'] as num).toDouble() : m);

    if (items.isEmpty) {
      return _Entrance(ctrl: _ctrl, begin: 0.5, end: 0.8,
        child: Container(
          margin: const EdgeInsets.only(top: 8),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Center(child: Text(
            'No ${_stockFilter == 'all' ? '' : _filters.firstWhere((f) => f.$1 == _stockFilter).$2.toLowerCase()} products',
            style: const TextStyle(color: Color(0xFF607D8B), fontSize: 13),
          )),
        ),
      );
    }

    return Column(
      children: List.generate(items.length, (i) => _StockRow(
        item: items[i] as Map<String, dynamic>,
        maxStock: maxStock,
        index: i,
        ctrl: _ctrl,
      )),
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  Widget _buildError(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.wifi_off_rounded, size: 52, color: cs.onSurface.withValues(alpha: 0.2)),
          const SizedBox(height: 16),
          Text('Failed to load dashboard', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.5))),
          const SizedBox(height: 6),
          Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.35))),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Retry'),
          ),
        ]),
      ),
    );
  }

  // ── Skeleton loader ───────────────────────────────────────────────────────────
  Widget _buildSkeleton(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _shimmer(180, 26), const SizedBox(height: 8), _shimmer(140, 14), const SizedBox(height: 24),
        _shimmer(80, 13), const SizedBox(height: 10),
        Row(children: [Expanded(child: _shimmer(double.infinity, 88)), const SizedBox(width: 12), Expanded(child: _shimmer(double.infinity, 88))]),
        const SizedBox(height: 12),
        Row(children: [Expanded(child: _shimmer(double.infinity, 88)), const SizedBox(width: 12), Expanded(child: _shimmer(double.infinity, 88))]),
        const SizedBox(height: 24),
        _shimmer(100, 13), const SizedBox(height: 10),
        ...List.generate(4, (_) => Padding(padding: const EdgeInsets.only(bottom: 8), child: _shimmer(double.infinity, 68))),
      ]),
    );
  }

  Widget _shimmer(double w, double h) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.4, end: 0.9),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeInOut,
      builder: (_, v, __) => Container(
        width: w == double.infinity ? null : w,
        height: h,
        decoration: BoxDecoration(
          color: const Color(0xFF607D8B).withValues(alpha: v * 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
