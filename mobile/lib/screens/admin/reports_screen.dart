import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

String _fmt(dynamic n) => (n as num? ?? 0).toStringAsFixed(0);

// ── Shared widgets ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      Container(width: 3, height: 14, decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(2))),
      const SizedBox(width: 8),
      Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface)),
    ]);
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final String? sub;
  const _KpiCard({required this.label, required this.value, required this.color, this.sub});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: color.withValues(alpha: 0.22)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.75), fontWeight: FontWeight.w700, letterSpacing: 0.3)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color, height: 1.1)),
          if (sub != null) ...[
            const SizedBox(height: 3),
            Text(sub!, style: TextStyle(fontSize: 9.5, color: color.withValues(alpha: 0.6)), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ]),
      ),
    );
  }
}

class _TableCard extends StatelessWidget {
  final String title;
  final List<String> headers;
  final List<List<String>> rows;
  final List<Color?>? rowColors;
  const _TableCard({required this.title, required this.headers, required this.rows, this.rowColors});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
          child: _SectionTitle(title),
        ),
        if (rows.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Text('No data', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.35))),
          )
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Table(
              defaultColumnWidth: const IntrinsicColumnWidth(),
              border: TableBorder(horizontalInside: BorderSide(color: cs.outline.withValues(alpha: 0.15))),
              children: [
                TableRow(
                  decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.06)),
                  children: headers.map((h) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    child: Text(h, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: cs.onSurface.withValues(alpha: 0.6))),
                  )).toList(),
                ),
                ...rows.asMap().entries.map((e) => TableRow(
                  children: e.value.asMap().entries.map((cell) {
                    final isLast = cell.key == e.value.length - 1;
                    final accentColor = (isLast && rowColors != null && rowColors![e.key] != null) ? rowColors![e.key] : null;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                      child: Text(
                        cell.value,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: cell.key == 0 ? FontWeight.w500 : FontWeight.w600,
                          color: accentColor ?? cs.onSurface.withValues(alpha: 0.8),
                        ),
                      ),
                    );
                  }).toList(),
                )),
              ],
            ),
          ),
      ]),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.wifi_off_rounded, size: 44, color: cs.onSurface.withValues(alpha: 0.2)),
        const SizedBox(height: 12),
        Text('Failed to load', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.45))),
        const SizedBox(height: 4),
        Text(message, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.3))),
        const SizedBox(height: 16),
        ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh_rounded, size: 15), label: const Text('Retry')),
      ]),
    );
  }
}

Widget _skeletonRow() => Padding(
  padding: const EdgeInsets.only(bottom: 10),
  child: Row(children: [
    Expanded(child: _skel(76)),
    const SizedBox(width: 10),
    Expanded(child: _skel(76)),
  ]),
);

Widget _skel(double h) => TweenAnimationBuilder<double>(
  tween: Tween(begin: 0.4, end: 0.85),
  duration: const Duration(milliseconds: 800),
  curve: Curves.easeInOut,
  builder: (_, v, __) => Container(
    height: h,
    decoration: BoxDecoration(
      color: const Color(0xFF607D8B).withValues(alpha: v * 0.15),
      borderRadius: BorderRadius.circular(10),
    ),
  ),
);

// ── Daily Tab ─────────────────────────────────────────────────────────────────

class _DailyTab extends StatefulWidget {
  const _DailyTab();
  @override
  State<_DailyTab> createState() => _DailyTabState();
}

class _DailyTabState extends State<_DailyTab> {
  DateTime _from = DateTime.now();
  DateTime _to   = DateTime.now();
  Map<String, dynamic>? _data;
  bool _loading = false;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token = context.read<AuthService>().token;
      final f = DateFormat('yyyy-MM-dd').format(_from);
      final t = DateFormat('yyyy-MM-dd').format(_to);
      final r = await ApiService.get('/reports/daily?from=$f&to=$t', token: token);
      if (mounted) setState(() => _data = r as Map<String, dynamic>);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFrom ? _from : _to,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() { if (isFrom) { _from = picked; } else { _to = picked; } });
      _load();
    }
  }

  Widget _buildContent(ColorScheme cs) {
    final s         = (_data!['summary'] as Map<String, dynamic>?) ?? {};
    final purchases = _data!['purchases'] as List? ?? [];
    final sales     = _data!['sales']     as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        _KpiCard(label: 'Units Purchased', value: _fmt(s['unitsPurchased']), color: const Color(0xFF5C6BC0)),
        const SizedBox(width: 10),
        _KpiCard(label: 'Units Sold',      value: _fmt(s['unitsSold']),      color: const Color(0xFF0097A7)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        _KpiCard(label: 'Revenue', value: '₹${_fmt(s['totalRevenue'])}', color: cs.primary),
        const SizedBox(width: 10),
        _KpiCard(label: 'Profit',  value: '₹${_fmt(s['totalProfit'])}',  color: const Color(0xFF2E9E4F)),
      ]),
      const SizedBox(height: 20),
      _TableCard(
        title: 'Purchases',
        headers: const ['Product', 'Qty', 'Cost'],
        rows: purchases.map((p) => [
          '${p['emoji'] ?? '🍦'} ${p['productName'] ?? ''}',
          _fmt(p['quantity']),
          '₹${_fmt(p['totalCost'])}',
        ]).toList(),
      ),
      _TableCard(
        title: 'Sales',
        headers: const ['Product', 'Qty', 'Revenue', 'Profit'],
        rows: sales.map((s) => [
          '${s['emoji'] ?? '🍦'} ${s['productName'] ?? ''}',
          _fmt(s['quantity']),
          '₹${_fmt(s['totalRevenue'])}',
          '₹${_fmt(s['profit'])}',
        ]).toList(),
        rowColors: sales.map((s) {
          final p = (s['profit'] as num? ?? 0).toDouble();
          return p >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935);
        }).toList(),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final cs  = Theme.of(context).colorScheme;
    final fmt = DateFormat('dd MMM yyyy');

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Row(children: [
            Expanded(child: _DateBtn(label: 'From', date: fmt.format(_from), onTap: () => _pickDate(true))),
            Container(width: 1, height: 36, color: cs.outline.withValues(alpha: 0.2), margin: const EdgeInsets.symmetric(horizontal: 12)),
            Expanded(child: _DateBtn(label: 'To', date: fmt.format(_to), onTap: () => _pickDate(false))),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () { HapticFeedback.selectionClick(); _load(); },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(10)),
                child: const Text('Load', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        if (_loading) ...[_skeletonRow(), _skeletonRow(), const SizedBox(height: 6), _skel(160), const SizedBox(height: 10), _skel(160)]
        else if (_error != null) _ErrorState(message: _error!, onRetry: _load)
        else if (_data != null)  _buildContent(cs),
      ]),
    );
  }
}

class _DateBtn extends StatelessWidget {
  final String label;
  final String date;
  final VoidCallback onTap;
  const _DateBtn({required this.label, required this.date, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.45))),
        const SizedBox(height: 3),
        Row(children: [
          Icon(Icons.calendar_today_rounded, size: 13, color: cs.primary),
          const SizedBox(width: 5),
          Text(date, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onSurface)),
        ]),
      ]),
    );
  }
}

// ── Monthly Tab ───────────────────────────────────────────────────────────────

class _MonthlyTab extends StatefulWidget {
  const _MonthlyTab();
  @override
  State<_MonthlyTab> createState() => _MonthlyTabState();
}

class _MonthlyTabState extends State<_MonthlyTab> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, dynamic>? _data;
  bool _loading = false;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token    = context.read<AuthService>().token;
      final monthStr = DateFormat('yyyy-MM').format(_month);
      final r = await ApiService.get('/reports/monthly?month=$monthStr', token: token);
      if (mounted) setState(() => _data = r as Map<String, dynamic>);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _changeMonth(int delta) {
    setState(() => _month = DateTime(_month.year, _month.month + delta));
    _load();
  }

  Widget _buildContent(ColorScheme cs) {
    final s         = (_data!['summary'] as Map<String, dynamic>?) ?? {};
    final dayWise   = _data!['dayWise']     as List? ?? [];
    final prodWise  = _data!['productWise'] as List? ?? [];
    final shopRev   = (s['shopRevenue']  as num? ?? 0).toStringAsFixed(0);
    final truckRev  = (s['truckRevenue'] as num? ?? 0).toStringAsFixed(0);
    final netProfit = (s['netProfit']    as num? ?? 0).toDouble();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        _KpiCard(label: 'Revenue', value: '₹${_fmt(s['totalRevenue'])}', color: cs.primary, sub: '🏪 ₹$shopRev · 🚚 ₹$truckRev'),
        const SizedBox(width: 10),
        _KpiCard(label: 'Gross Profit', value: '₹${_fmt(s['grossProfit'] ?? s['totalProfit'])}', color: const Color(0xFF2E9E4F)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        _KpiCard(label: 'Expenses',   value: '₹${_fmt(s['totalExpenses'])}', color: const Color(0xFFE53935)),
        const SizedBox(width: 10),
        _KpiCard(label: 'Net Profit', value: '₹${_fmt(s['netProfit'])}',     color: netProfit >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935)),
      ]),
      const SizedBox(height: 20),
      _TableCard(
        title: 'Day-wise Breakdown',
        headers: const ['Date', 'Purchase', 'Revenue', 'Profit'],
        rows: dayWise.map((d) => [
          d['date'] as String? ?? '',
          '₹${_fmt(d['purchaseCost'])}',
          '₹${_fmt(d['revenue'])}',
          '₹${_fmt(d['profit'])}',
        ]).toList(),
        rowColors: dayWise.map((d) {
          final p = (d['profit'] as num? ?? 0).toDouble();
          return p >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935);
        }).toList(),
      ),
      _TableCard(
        title: 'Product-wise Summary',
        headers: const ['Product', 'Units', 'Revenue', 'Profit'],
        rows: prodWise.map((p) => [
          '${p['emoji'] ?? '🍦'} ${p['productName'] ?? ''}',
          _fmt(p['unitsSold']),
          '₹${_fmt(p['totalRevenue'])}',
          '₹${_fmt(p['totalProfit'])}',
        ]).toList(),
        rowColors: prodWise.map((p) {
          final profit = (p['totalProfit'] as num? ?? 0).toDouble();
          return profit >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935);
        }).toList(),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final cs      = Theme.of(context).colorScheme;
    final canNext = _month.isBefore(DateTime(DateTime.now().year, DateTime.now().month));

    return RefreshIndicator(
      onRefresh: () async { HapticFeedback.mediumImpact(); await _load(); },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded),
                onPressed: () { HapticFeedback.selectionClick(); _changeMonth(-1); },
                padding: EdgeInsets.zero, constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 20),
              Text(DateFormat('MMMM yyyy').format(_month), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(width: 20),
              IconButton(
                icon: Icon(Icons.chevron_right_rounded, color: canNext ? null : cs.onSurface.withValues(alpha: 0.2)),
                onPressed: canNext ? () { HapticFeedback.selectionClick(); _changeMonth(1); } : null,
                padding: EdgeInsets.zero, constraints: const BoxConstraints(),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          if (_loading) ...[_skeletonRow(), _skeletonRow(), const SizedBox(height: 6), _skel(200), const SizedBox(height: 10), _skel(200)]
          else if (_error != null) _ErrorState(message: _error!, onRetry: _load)
          else if (_data != null)  _buildContent(cs),
        ]),
      ),
    );
  }
}

// ── Yearly Tab ────────────────────────────────────────────────────────────────

class _YearlyTab extends StatefulWidget {
  const _YearlyTab();
  @override
  State<_YearlyTab> createState() => _YearlyTabState();
}

class _YearlyTabState extends State<_YearlyTab> {
  int _year = DateTime.now().year;
  Map<String, dynamic>? _data;
  bool _loading = false;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token = context.read<AuthService>().token;
      final r = await ApiService.get('/reports/yearly?year=$_year', token: token);
      if (mounted) setState(() => _data = r as Map<String, dynamic>);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildContent(ColorScheme cs) {
    final months       = _data!['months'] as List? ?? [];
    final totalRev     = months.fold<double>(0, (a, m) => a + (m['revenue']   as num? ?? 0).toDouble());
    final totalProfit  = months.fold<double>(0, (a, m) => a + (m['profit']    as num? ?? 0).toDouble());
    final totalExp     = months.fold<double>(0, (a, m) => a + (m['expenses']  as num? ?? 0).toDouble());
    final netProfit    = months.fold<double>(0, (a, m) => a + (m['netProfit'] as num? ?? 0).toDouble());

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        _KpiCard(label: 'Total Revenue', value: '₹${totalRev.toStringAsFixed(0)}',    color: cs.primary),
        const SizedBox(width: 10),
        _KpiCard(label: 'Gross Profit',  value: '₹${totalProfit.toStringAsFixed(0)}', color: const Color(0xFF2E9E4F)),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        _KpiCard(label: 'Total Expenses', value: '₹${totalExp.toStringAsFixed(0)}',   color: const Color(0xFFE53935)),
        const SizedBox(width: 10),
        _KpiCard(label: 'Net Profit',     value: '₹${netProfit.toStringAsFixed(0)}',  color: netProfit >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935)),
      ]),
      const SizedBox(height: 20),
      _TableCard(
        title: 'Month-wise Breakdown — $_year',
        headers: const ['Month', 'Revenue', 'Profit', 'Net Profit'],
        rows: months.map((m) => [
          m['label'] as String? ?? '',
          '₹${_fmt(m['revenue'])}',
          '₹${_fmt(m['profit'])}',
          '₹${_fmt(m['netProfit'])}',
        ]).toList(),
        rowColors: months.map((m) {
          final np = (m['netProfit'] as num? ?? 0).toDouble();
          return np >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935);
        }).toList(),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final cs    = Theme.of(context).colorScheme;
    final years = [2024, 2025, 2026, 2027];

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Row(children: [
            Icon(Icons.calendar_month_rounded, size: 18, color: cs.primary),
            const SizedBox(width: 10),
            DropdownButton<int>(
              value: _year,
              underline: const SizedBox(),
              isDense: true,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: cs.onSurface),
              items: years.map((y) => DropdownMenuItem(value: y, child: Text('$y'))).toList(),
              onChanged: (y) { if (y != null) setState(() => _year = y); },
            ),
            const Spacer(),
            GestureDetector(
              onTap: () { HapticFeedback.selectionClick(); _load(); },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(10)),
                child: const Text('Load', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        if (_loading) ...[_skeletonRow(), _skeletonRow(), const SizedBox(height: 6), _skel(300)]
        else if (_error != null) _ErrorState(message: _error!, onRetry: _load)
        else if (_data != null)  _buildContent(cs),
      ]),
    );
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this, initialIndex: 1);
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

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
        bottom: TabBar(
          controller: _tabCtrl,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          indicatorWeight: 3,
          indicatorColor: cs.primary,
          labelColor: cs.primary,
          unselectedLabelColor: cs.onSurface.withValues(alpha: 0.45),
          tabs: const [Tab(text: 'Daily'), Tab(text: 'Monthly'), Tab(text: 'Yearly')],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: const [_DailyTab(), _MonthlyTab(), _YearlyTab()],
      ),
    );
  }
}
