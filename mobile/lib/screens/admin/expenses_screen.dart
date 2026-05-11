import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

const _kCategories = ['SALARY', 'INCENTIVE', 'ELECTRICITY', 'RENT', 'MAINTENANCE', 'TRANSPORT', 'MISC'];

const _kCatIcons = {
  'SALARY':      Icons.people_alt_outlined,
  'INCENTIVE':   Icons.emoji_events_outlined,
  'ELECTRICITY': Icons.bolt_outlined,
  'RENT':        Icons.home_outlined,
  'MAINTENANCE': Icons.build_outlined,
  'TRANSPORT':   Icons.local_shipping_outlined,
  'MISC':        Icons.category_outlined,
};

const _kCatColors = {
  'SALARY':      Color(0xFF7C3AED),
  'INCENTIVE':   Color(0xFFF59E0B),
  'ELECTRICITY': Color(0xFF0EA5E9),
  'RENT':        Color(0xFF10B981),
  'MAINTENANCE': Color(0xFFEF4444),
  'TRANSPORT':   Color(0xFF06B6D4),
  'MISC':        Color(0xFF6B7280),
};

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});
  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  List<dynamic> _expenses = [];
  Map<String, dynamic>? _summary;
  List<dynamic> _branches = [];
  bool _loading = true;
  String? _error;

  int _month = DateTime.now().month;
  int _year  = DateTime.now().year;
  String? _catFilter;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    final auth = context.read<AuthService>();
    setState(() { _loading = true; _error = null; });
    try {
      final futures = <Future>[
        ApiService.get('/expenses?month=$_month&year=$_year', token: auth.token),
        ApiService.get('/expenses/summary?month=$_month&year=$_year', token: auth.token),
      ];
      if (auth.isAdmin) futures.add(ApiService.get('/branches', token: auth.token));

      final results = await Future.wait(futures);
      setState(() {
        _expenses = results[0] as List;
        _summary  = results[1] as Map<String, dynamic>;
        if (auth.isAdmin && results.length > 2) _branches = results[2] as List;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(String iso) {
    try { return DateFormat('dd MMM').format(DateTime.parse(iso).toLocal()); } catch (_) { return ''; }
  }

  String _fmtCurrency(dynamic n) => '₹${(n as num? ?? 0).toStringAsFixed(0)}';

  List<dynamic> get _filtered {
    if (_catFilter == null) return _expenses;
    return _expenses.where((e) => e['category'] == _catFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _loadAll),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context, auth),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Expense'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAll,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Month picker
                  _monthPicker(cs),
                  const SizedBox(height: 16),

                  // KPI cards
                  if (_summary != null) ...[
                    Row(children: [
                      Expanded(child: _kpi('Expenses', _fmtCurrency(_summary!['totalExpenses']), const Color(0xFFEF4444), Icons.money_off_rounded)),
                      const SizedBox(width: 10),
                      Expanded(child: _kpi('Revenue', _fmtCurrency(_summary!['totalRevenue']), cs.primary, Icons.receipt_long_rounded)),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(child: _kpi('Gross Profit', _fmtCurrency(_summary!['grossProfit']), const Color(0xFF2E9E4F), Icons.trending_up_rounded)),
                      const SizedBox(width: 10),
                      Expanded(child: _kpi('Net Profit', _fmtCurrency(_summary!['netProfit']),
                          (_summary!['netProfit'] as num? ?? 0) >= 0 ? const Color(0xFF0EA5E9) : const Color(0xFFEF4444),
                          Icons.account_balance_outlined)),
                    ]),
                    const SizedBox(height: 16),

                    // Category breakdown
                    _buildBreakdown(cs),
                    const SizedBox(height: 16),
                  ],

                  // Category filter chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(children: [
                      _chip('All', null, cs),
                      ..._kCategories.map((c) => Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _chip(c, c, cs),
                      )),
                    ]),
                  ),
                  const SizedBox(height: 12),

                  // Expenses list
                  if (_error != null)
                    Text(_error!, style: const TextStyle(color: Colors.red))
                  else if (_filtered.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 24),
                      child: Center(child: Text('No expenses for this period', style: TextStyle(color: Color(0xFF607D8B)))),
                    )
                  else
                    ...(_filtered.map((e) => _expenseRow(e, cs, auth))),

                  const SizedBox(height: 80),
                ]),
              ),
            ),
    );
  }

  Widget _monthPicker(ColorScheme cs) {
    final months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        IconButton(
          icon: const Icon(Icons.chevron_left_rounded),
          onPressed: () {
            setState(() {
              _month--; if (_month < 1) { _month = 12; _year--; }
            });
            _loadAll();
          },
          padding: EdgeInsets.zero, constraints: const BoxConstraints(),
        ),
        Text('${months[_month]} $_year', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: cs.primary)),
        IconButton(
          icon: const Icon(Icons.chevron_right_rounded),
          onPressed: () {
            setState(() {
              _month++; if (_month > 12) { _month = 1; _year++; }
            });
            _loadAll();
          },
          padding: EdgeInsets.zero, constraints: const BoxConstraints(),
        ),
      ]),
    );
  }

  Widget _kpi(String label, String value, Color color, IconData icon) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withValues(alpha: 0.2)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.8), fontWeight: FontWeight.w600)),
      ]),
      const SizedBox(height: 6),
      Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
    ]),
  );

  Widget _buildBreakdown(ColorScheme cs) {
    final breakdown = _summary!['breakdown'] as Map<String, dynamic>? ?? {};
    final total = breakdown.values.fold<double>(0, (a, v) => a + (v as num).toDouble());
    if (total == 0) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Category Breakdown', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: cs.onSurface)),
          const SizedBox(height: 12),
          ...breakdown.entries.where((e) => (e.value as num) > 0).map((e) {
            final pct = total > 0 ? (e.value as num).toDouble() / total : 0.0;
            final color = _kCatColors[e.key] ?? const Color(0xFF6B7280);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                SizedBox(width: 88, child: Text(e.key, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600))),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      backgroundColor: color.withValues(alpha: 0.1),
                      valueColor: AlwaysStoppedAnimation(color),
                      minHeight: 8,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(width: 56, child: Text('₹${(e.value as num).toStringAsFixed(0)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color), textAlign: TextAlign.right)),
              ]),
            );
          }),
        ]),
      ),
    );
  }

  Widget _chip(String label, String? value, ColorScheme cs) {
    final selected = _catFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _catFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? cs.primary : cs.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: TextStyle(
          color: selected ? Colors.white : cs.onSurface,
          fontSize: 11, fontWeight: FontWeight.w600,
        )),
      ),
    );
  }

  Widget _expenseRow(Map<String, dynamic> e, ColorScheme cs, AuthService auth) {
    final color = _kCatColors[e['category']] ?? const Color(0xFF6B7280);
    final icon  = _kCatIcons[e['category']] ?? Icons.category_outlined;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(e['category'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        subtitle: Text(
          '${e['branch']?['name'] ?? ''} · ${_fmt(e['createdAt'] as String? ?? '')}${e['notes'] != null ? ' · ${e['notes']}' : ''}',
          style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
          maxLines: 1, overflow: TextOverflow.ellipsis,
        ),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('₹${(e['amount'] as num).toStringAsFixed(0)}',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: color)),
          if (auth.isAdmin || auth.user?.role == 'BRANCH_MANAGER') ...[
            const SizedBox(width: 4),
            PopupMenuButton<String>(
              onSelected: (v) {
                if (v == 'edit') _showForm(context, auth, expense: e);
                if (v == 'delete') _deleteExpense(e['id']);
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'edit',   child: Text('Edit')),
                PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
              ],
              child: const Icon(Icons.more_vert_rounded, size: 18),
            ),
          ],
        ]),
      ),
    );
  }

  Future<void> _deleteExpense(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Expense'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;
    final auth = context.read<AuthService>();
    try {
      await ApiService.delete('/expenses/$id', token: auth.token);
      _loadAll();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  void _showForm(BuildContext ctx, AuthService auth, {Map<String, dynamic>? expense}) {
    final isEdit = expense != null;
    final amtCtrl  = TextEditingController(text: isEdit ? '${expense['amount']}' : '');
    final notesCtrl = TextEditingController(text: isEdit ? (expense['notes'] ?? '') : '');
    String cat   = isEdit ? (expense['category'] as String) : _kCategories[0];
    int branchId = isEdit
        ? (expense['branchId'] as int? ?? auth.user?.branchId ?? 0)
        : (auth.user?.branchId ?? (auth.isAdmin && _branches.isNotEmpty ? (_branches[0]['id'] as int) : 0));

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
                Text(isEdit ? 'Edit Expense' : 'Add Expense',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),

                // Category
                DropdownButtonFormField<String>(
                  initialValue: cat,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: _kCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (v) => setSt(() => cat = v!),
                ),
                const SizedBox(height: 12),

                // Branch (admin only)
                if (auth.isAdmin && _branches.isNotEmpty) ...[
                  DropdownButtonFormField<int>(
                    initialValue: branchId != 0 ? branchId : null,
                    decoration: const InputDecoration(labelText: 'Branch'),
                    items: _branches.map<DropdownMenuItem<int>>((b) => DropdownMenuItem(value: b['id'] as int, child: Text(b['name'] as String))).toList(),
                    onChanged: (v) => setSt(() => branchId = v!),
                  ),
                  const SizedBox(height: 12),
                ],

                // Amount
                TextFormField(
                  controller: amtCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                  decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
                ),
                const SizedBox(height: 12),

                // Notes
                TextFormField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                  maxLines: 2,
                ),
                const SizedBox(height: 20),

                ElevatedButton.icon(
                  onPressed: () async {
                    final amt = double.tryParse(amtCtrl.text);
                    final messenger = ScaffoldMessenger.of(ctx);
                    if (amt == null || amt < 0) {
                      messenger.showSnackBar(const SnackBar(content: Text('Enter a valid amount'), backgroundColor: Colors.red));
                      return;
                    }
                    final body = {
                      'branchId': branchId != 0 ? branchId : auth.user?.branchId,
                      'category': cat,
                      'amount': amt,
                      'month': _month,
                      'year': _year,
                      'notes': notesCtrl.text.isEmpty ? null : notesCtrl.text,
                    };
                    try {
                      if (isEdit) {
                        await ApiService.put('/expenses/${expense['id']}', body, token: auth.token);
                      } else {
                        await ApiService.post('/expenses', body, token: auth.token);
                      }
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      _loadAll();
                    } catch (e) {
                      messenger.showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                    }
                  },
                  icon: const Icon(Icons.save_rounded),
                  label: Text(isEdit ? 'Save Changes' : 'Add Expense'),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }
}
