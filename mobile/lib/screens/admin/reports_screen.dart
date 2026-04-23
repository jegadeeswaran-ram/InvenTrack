import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  @override void initState() { super.initState(); _tab = TabController(length: 3, vsync: this, initialIndex: 1); }
  @override void dispose() { _tab.dispose(); super.dispose(); }
  String? get _token => context.read<AuthService>().token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        leading: IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer()),
        bottom: TabBar(
          controller: _tab,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.today_outlined, size: 18), text: 'Daily'),
            Tab(icon: Icon(Icons.calendar_month_outlined, size: 18), text: 'Monthly'),
            Tab(icon: Icon(Icons.calendar_today_outlined, size: 18), text: 'Yearly'),
          ],
        ),
      ),
      body: TabBarView(controller: _tab, children: [
        _DailyTab(token: _token),
        _MonthlyTab(token: _token),
        _YearlyTab(token: _token),
      ]),
    );
  }
}

// ── KPI card config ─────────────────────────────────────────────────────────
class _KpiConfig {
  final String label, value;
  final IconData icon;
  final List<Color> gradient;
  const _KpiConfig({required this.label, required this.value, required this.icon, required this.gradient});
}

const _kpiGradients = [
  [Color(0xFF5C6BC0), Color(0xFF7986CB)],  // units purchased – indigo
  [Color(0xFFE65100), Color(0xFFFB8C00)],  // units sold – orange
  [Color(0xFF0097A7), Color(0xFF00BFA5)],  // purchase cost – teal
  [Color(0xFF6A1B9A), Color(0xFF9C27B0)],  // revenue – purple
  [Color(0xFF2E7D32), Color(0xFF43A047)],  // profit – green
];

List<_KpiConfig> _buildKpis(Map summary) => [
  _KpiConfig(label: 'Units Purchased', value: '${(summary['unitsPurchased'] ?? 0).toStringAsFixed(0)}', icon: Icons.shopping_cart_rounded, gradient: _kpiGradients[0]),
  _KpiConfig(label: 'Units Sold', value: '${(summary['unitsSold'] ?? 0).toStringAsFixed(0)}', icon: Icons.receipt_long_rounded, gradient: _kpiGradients[1]),
  _KpiConfig(label: 'Purchase Cost', value: '₹${((summary['totalPurchaseCost'] ?? 0) as num).toStringAsFixed(0)}', icon: Icons.account_balance_wallet_rounded, gradient: _kpiGradients[2]),
  _KpiConfig(label: 'Revenue', value: '₹${((summary['totalRevenue'] ?? 0) as num).toStringAsFixed(0)}', icon: Icons.bar_chart_rounded, gradient: _kpiGradients[3]),
  _KpiConfig(label: 'Profit', value: '₹${((summary['totalProfit'] ?? 0) as num).toStringAsFixed(0)}', icon: Icons.trending_up_rounded, gradient: _kpiGradients[4]),
];

// ── Animated KPI grid ───────────────────────────────────────────────────────
class _AnimatedKpiGrid extends StatefulWidget {
  final Map summary;
  const _AnimatedKpiGrid({required this.summary});
  @override State<_AnimatedKpiGrid> createState() => _AnimatedKpiGridState();
}

class _AnimatedKpiGridState extends State<_AnimatedKpiGrid> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..forward();
  }

  @override
  void didUpdateWidget(_AnimatedKpiGrid old) {
    super.didUpdateWidget(old);
    if (old.summary != widget.summary) _ctrl.forward(from: 0);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final kpis = _buildKpis(widget.summary);
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.15,
      ),
      itemCount: kpis.length,
      itemBuilder: (_, i) {
        final delay = i * 0.12;
        final anim = CurvedAnimation(
          parent: _ctrl,
          curve: Interval(delay, math.min(delay + 0.55, 1.0), curve: Curves.easeOutBack),
        );
        return AnimatedBuilder(
          animation: anim,
          builder: (_, child) => Transform.scale(
            scale: anim.value.clamp(0.0, 1.5),
            child: Opacity(opacity: anim.value.clamp(0.0, 1.0), child: child),
          ),
          child: _KpiCard(cfg: kpis[i]),
        );
      },
    );
  }
}

// ── Single KPI card ─────────────────────────────────────────────────────────
class _KpiCard extends StatelessWidget {
  final _KpiConfig cfg;
  const _KpiCard({required this.cfg});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: cfg.gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: cfg.gradient[0].withValues(alpha: 0.36), blurRadius: 14, offset: const Offset(0, 6))],
      ),
      child: Stack(children: [
        Positioned(right: -14, top: -14, child: Container(width: 64, height: 64, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1)))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            // Icon + label on same row
            Row(children: [
              Container(
                width: 34, height: 34,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(9)),
                child: Icon(cfg.icon, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(cfg.label, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.88), fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
            ]),
            const SizedBox(height: 8),
            // Large value
            Text(cfg.value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, height: 1)),
          ]),
        ),
      ]),
    );
  }
}

// ── Table card with slide-in animation ─────────────────────────────────────
class _AnimatedTableCard extends StatefulWidget {
  final String title;
  final IconData icon;
  final List<String> headers;
  final List<List<String>> rows;
  final int delay; // ms
  const _AnimatedTableCard({required this.title, required this.icon, required this.headers, required this.rows, this.delay = 0});
  @override State<_AnimatedTableCard> createState() => _AnimatedTableCardState();
}

class _AnimatedTableCardState extends State<_AnimatedTableCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<Offset> _slide;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _slide = Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    Future.delayed(Duration(milliseconds: widget.delay), () { if (mounted) _ctrl.forward(); });
  }

  @override
  void didUpdateWidget(_AnimatedTableCard old) {
    super.didUpdateWidget(old);
    if (old.rows != widget.rows) _ctrl.forward(from: 0);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 3))],
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Header bar
            Container(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: cs.onSurface.withValues(alpha: 0.07))),
              ),
              child: Row(children: [
                Icon(widget.icon, size: 17, color: const Color(0xFF0097A7)),
                const SizedBox(width: 8),
                Text(widget.title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: cs.onSurface)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(20)),
                  child: Text('${widget.rows.length}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0097A7))),
                ),
              ]),
            ),
            // Table
            widget.rows.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(child: Text('No data', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.4), fontSize: 13))),
                  )
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: DataTable(
                      headingRowHeight: 36,
                      dataRowMinHeight: 36,
                      dataRowMaxHeight: 42,
                      columnSpacing: 18,
                      headingRowColor: WidgetStateProperty.all(cs.onSurface.withValues(alpha: 0.04)),
                      columns: widget.headers.map((h) => DataColumn(
                        label: Text(h, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: cs.onSurface.withValues(alpha: 0.55))),
                      )).toList(),
                      rows: widget.rows.map((r) => DataRow(
                        cells: r.map((c) {
                          final isProfit = c.startsWith('₹') && (widget.headers.last == 'Profit' && r.last == c);
                          final profitVal = isProfit ? double.tryParse(c.replaceAll('₹', '').replaceAll(',', '')) : null;
                          Color textColor = cs.onSurface;
                          if (profitVal != null) textColor = profitVal >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935);
                          return DataCell(Text(c, style: TextStyle(fontSize: 12, color: textColor, fontWeight: isProfit ? FontWeight.w700 : FontWeight.w400)));
                        }).toList(),
                      )).toList(),
                    ),
                  ),
            const SizedBox(height: 4),
          ]),
        ),
      ),
    );
  }
}

// ── Date picker row ─────────────────────────────────────────────────────────
Widget _datePicker(String label, DateTime date, VoidCallback onTap, ColorScheme cs) {
  return InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.onSurface.withValues(alpha: 0.12)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
      ),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.calendar_today_outlined, size: 16, color: Color(0xFF0097A7)),
        ),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(DateFormat('dd MMM yyyy').format(date), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: cs.onSurface)),
        ]),
      ]),
    ),
  );
}

// ── Daily tab ───────────────────────────────────────────────────────────────
class _DailyTab extends StatefulWidget {
  final String? token;
  const _DailyTab({required this.token});
  @override State<_DailyTab> createState() => _DailyTabState();
}

class _DailyTabState extends State<_DailyTab> {
  DateTime _from = DateTime.now();
  DateTime _to = DateTime.now();
  Map<String, dynamic>? _data;
  bool _loading = false;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final f = DateFormat('yyyy-MM-dd').format(_from);
      final t = DateFormat('yyyy-MM-dd').format(_to);
      final r = await ApiService.get('/reports/daily?from=$f&to=$t', token: widget.token);
      setState(() => _data = r);
    } catch (_) {} finally { setState(() => _loading = false); }
  }

  Future<void> _pickDate(bool isFrom) async {
    final d = await showDatePicker(context: context,
      initialDate: isFrom ? _from : _to, firstDate: DateTime(2020), lastDate: DateTime.now());
    if (d != null) { setState(() { if (isFrom) _from = d; else _to = d; }); _load(); }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final summary = _data?['summary'] ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Row(children: [
            Expanded(child: _datePicker('From', _from, () => _pickDate(true), cs)),
            const SizedBox(width: 10),
            Expanded(child: _datePicker('To', _to, () => _pickDate(false), cs)),
          ]),
        ),
        const SizedBox(height: 14),
        if (_loading) const Center(child: CircularProgressIndicator()),
        if (_data != null && !_loading) ...[
          Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: _AnimatedKpiGrid(summary: summary)),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _AnimatedTableCard(
              title: 'Purchases', icon: Icons.shopping_cart_outlined,
              headers: ['Product', 'Qty', 'Cost'],
              rows: (_data!['purchases'] as List).map((p) => <String>[
                p['productName'].toString(), '${p['quantity']}', '₹${(p['totalCost'] as num).toStringAsFixed(2)}',
              ]).toList(),
              delay: 200,
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _AnimatedTableCard(
              title: 'Sales', icon: Icons.receipt_long_outlined,
              headers: ['Product', 'Qty', 'Revenue', 'Profit'],
              rows: (_data!['sales'] as List).map((s) => <String>[
                s['productName'].toString(), '${s['quantity']}',
                '₹${(s['totalRevenue'] as num).toStringAsFixed(2)}', '₹${(s['profit'] as num).toStringAsFixed(2)}',
              ]).toList(),
              delay: 320,
            ),
          ),
          const SizedBox(height: 14),
        ],
      ]),
    );
  }
}

// ── Monthly tab ─────────────────────────────────────────────────────────────
class _MonthlyTab extends StatefulWidget {
  final String? token;
  const _MonthlyTab({required this.token});
  @override State<_MonthlyTab> createState() => _MonthlyTabState();
}

class _MonthlyTabState extends State<_MonthlyTab> {
  String _month = DateFormat('yyyy-MM').format(DateTime.now());
  Map<String, dynamic>? _data;
  bool _loading = false;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final r = await ApiService.get('/reports/monthly?month=$_month', token: widget.token);
      setState(() => _data = r);
    } catch (_) {} finally { setState(() => _loading = false); }
  }

  Future<void> _pickMonth() async {
    final now = DateTime.now();
    DateTime picked = DateFormat('yyyy-MM').parse(_month);
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Select Month'),
        content: SizedBox(width: 300, height: 300, child: YearPicker(
          firstDate: DateTime(2024), lastDate: now, selectedDate: picked,
          onChanged: (d) { setState(() => _month = DateFormat('yyyy-MM').format(d)); Navigator.pop(context); _load(); },
        )),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final summary = _data?['summary'] ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: InkWell(
            onTap: _pickMonth,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cs.onSurface.withValues(alpha: 0.12)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
              ),
              child: Row(children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.calendar_month_rounded, color: Color(0xFF0097A7), size: 20),
                ),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Selected Month', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(DateFormat('MMMM yyyy').format(DateFormat('yyyy-MM').parse(_month)),
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface)),
                ]),
                const Spacer(),
                if (_loading)
                  const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                else
                  Icon(Icons.arrow_drop_down_rounded, color: cs.onSurface.withValues(alpha: 0.4)),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 14),
        if (_loading) const Center(child: CircularProgressIndicator()),
        if (_data != null && !_loading) ...[
          Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: _AnimatedKpiGrid(summary: summary)),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _AnimatedTableCard(
              title: 'Day-wise Breakdown', icon: Icons.today_outlined,
              headers: ['Date', 'Cost', 'Revenue', 'Profit'],
              rows: (_data!['dayWise'] as List).map((d) => <String>[
                d['date'].toString(),
                '₹${(d['purchaseCost'] as num).toStringAsFixed(2)}',
                '₹${(d['revenue'] as num).toStringAsFixed(2)}',
                '₹${(d['profit'] as num).toStringAsFixed(2)}',
              ]).toList(),
              delay: 200,
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _AnimatedTableCard(
              title: 'Product-wise Breakdown', icon: Icons.sell_outlined,
              headers: ['Product', 'Sold', 'Revenue', 'Profit'],
              rows: (_data!['productWise'] as List).map((p) => <String>[
                p['productName'].toString(), '${p['unitsSold']}',
                '₹${(p['totalRevenue'] as num).toStringAsFixed(2)}',
                '₹${(p['totalProfit'] as num).toStringAsFixed(2)}',
              ]).toList(),
              delay: 320,
            ),
          ),
          const SizedBox(height: 14),
        ],
      ]),
    );
  }
}

// ── Yearly tab ──────────────────────────────────────────────────────────────
class _YearlyTab extends StatefulWidget {
  final String? token;
  const _YearlyTab({required this.token});
  @override State<_YearlyTab> createState() => _YearlyTabState();
}

class _YearlyTabState extends State<_YearlyTab> {
  String _year = DateTime.now().year.toString();
  Map<String, dynamic>? _data;
  bool _loading = false;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final r = await ApiService.get('/reports/yearly?year=$_year', token: widget.token);
      setState(() => _data = r);
    } catch (_) {} finally { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final summary = _data?['summary'] ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: cs.onSurface.withValues(alpha: 0.12)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
            ),
            child: Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.calendar_today_rounded, color: Color(0xFF0097A7), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _year,
                    isExpanded: true,
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface),
                    items: ['2024', '2025', '2026', '2027'].map((y) => DropdownMenuItem(value: y, child: Text(y))).toList(),
                    onChanged: (v) { if (v != null) { setState(() => _year = v); _load(); } },
                  ),
                ),
              ),
              if (_loading) const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
            ]),
          ),
        ),
        const SizedBox(height: 14),
        if (_loading) const Center(child: CircularProgressIndicator()),
        if (_data != null && !_loading) ...[
          Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: _AnimatedKpiGrid(summary: summary)),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _AnimatedTableCard(
              title: '${_data!['year']} — Month-wise',
              icon: Icons.bar_chart_rounded,
              headers: ['Month', 'Cost', 'Revenue', 'Profit'],
              rows: (_data!['months'] as List).map((m) => <String>[
                m['label'].toString(),
                '₹${(m['purchaseCost'] as num).toStringAsFixed(2)}',
                '₹${(m['revenue'] as num).toStringAsFixed(2)}',
                '₹${(m['profit'] as num).toStringAsFixed(2)}',
              ]).toList(),
              delay: 200,
            ),
          ),
          const SizedBox(height: 14),
        ],
      ]),
    );
  }
}
