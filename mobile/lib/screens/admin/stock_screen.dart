import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../shell_scope.dart';

const _kLow = 20.0;

String _cat(double v) {
  if (v <= 0) return 'out';
  if (v <= _kLow) return 'low';
  return 'ok';
}

// ── Filter chip ───────────────────────────────────────────────────────────────
class _FilterChip extends StatefulWidget {
  final String label;
  final int count;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.count, required this.color, required this.active, required this.onTap});

  @override
  State<_FilterChip> createState() => _FilterChipState();
}

class _FilterChipState extends State<_FilterChip> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    final isActive = widget.active;
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); widget.onTap(); },
      onTapDown:   (_) => setState(() => _pressed = true),
      onTapUp:     (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        transform: Matrix4.translationValues(0, _pressed ? 1 : (isActive ? -2 : 0), 0),
        transformAlignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? widget.color : widget.color.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? widget.color : widget.color.withValues(alpha: 0.28)),
          boxShadow: isActive ? [BoxShadow(color: widget.color.withValues(alpha: 0.28), blurRadius: 8, offset: const Offset(0, 3))] : null,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(widget.label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : widget.color)),
          const SizedBox(width: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: isActive ? Colors.white.withValues(alpha: 0.25) : widget.color,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('${widget.count}', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }
}

// ── Summary tile ──────────────────────────────────────────────────────────────
class _SummaryTile extends StatefulWidget {
  final int count;
  final String label;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  const _SummaryTile({required this.count, required this.label, required this.color, required this.active, required this.onTap});

  @override
  State<_SummaryTile> createState() => _SummaryTileState();
}

class _SummaryTileState extends State<_SummaryTile> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () { HapticFeedback.selectionClick(); widget.onTap(); },
        onTapDown:   (_) => setState(() => _pressed = true),
        onTapUp:     (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutBack,
          transform: Matrix4.translationValues(0, _pressed ? 2 : (widget.active ? -3 : 0), 0),
          transformAlignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: widget.active ? 0.15 : 0.08),
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: widget.color.withValues(alpha: widget.active ? 0.55 : 0.18), width: widget.active ? 1.5 : 1),
            boxShadow: widget.active ? [BoxShadow(color: widget.color.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 3))] : null,
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${widget.count}', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: widget.color, height: 1)),
            const SizedBox(height: 3),
            Text(widget.label, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: widget.color.withValues(alpha: 0.8)), maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
      ),
    );
  }
}

// ── Stock row ─────────────────────────────────────────────────────────────────
class _StockItem extends StatefulWidget {
  final Map<String, dynamic> data;
  final double maxStock;
  final int index;
  const _StockItem({required this.data, required this.maxStock, required this.index});

  @override
  State<_StockItem> createState() => _StockItemState();
}

class _StockItemState extends State<_StockItem> with SingleTickerProviderStateMixin {
  bool _pressed = false;
  late AnimationController _enterCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _enterCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    final curve = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOutCubic);
    _fadeAnim  = Tween<double>(begin: 0, end: 1).animate(curve);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(curve);
    Future.delayed(Duration(milliseconds: widget.index * 45), () {
      if (mounted) _enterCtrl.forward();
    });
  }

  @override
  void dispose() { _enterCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final cs     = Theme.of(context).colorScheme;
    final inHand = (widget.data['inHand'] as num? ?? 0).toDouble();
    final cat    = _cat(inHand);
    final color  = cat == 'out' ? const Color(0xFFE53935) : cat == 'low' ? const Color(0xFFFB8C00) : const Color(0xFF2E9E4F);
    final prog   = widget.maxStock > 0 ? (inHand.clamp(0, widget.maxStock) / widget.maxStock) : 0.0;
    final name   = widget.data['productName'] ?? widget.data['name'] ?? '';
    final price  = (widget.data['sellingPrice'] as num? ?? 0).toStringAsFixed(0);

    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
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
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
              child: Row(children: [
                Text(widget.data['emoji'] ?? '🍦', style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text('₹$price / pc', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.45))),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: prog),
                      duration: const Duration(milliseconds: 800),
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
                  const SizedBox(height: 5),
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
      ),
    );
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────
class StockScreen extends StatefulWidget {
  const StockScreen({super.key});
  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  List<dynamic> _stock   = [];
  bool _loading          = true;
  String _search         = '';
  String _filter         = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthService>().token;
      final data  = await ApiService.get('/reports/stock', token: token);
      if (mounted) setState(() => _stock = data as List);
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  List<dynamic> get _filtered {
    var list = _stock;
    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      list = list.where((s) => (s['productName'] ?? s['name'] ?? '').toString().toLowerCase().contains(q)).toList();
    }
    return switch (_filter) {
      'ok'  => list.where((s) => (s['inHand'] as num? ?? 0) > _kLow).toList(),
      'low' => list.where((s) { final v = (s['inHand'] as num? ?? 0).toDouble(); return v > 0 && v <= _kLow; }).toList(),
      'out' => list.where((s) => (s['inHand'] as num? ?? 0) <= 0).toList(),
      _     => list,
    };
  }

  int _count(String cat) => switch (cat) {
    'ok'  => _stock.where((s) => (s['inHand'] as num? ?? 0) > _kLow).length,
    'low' => _stock.where((s) { final v = (s['inHand'] as num? ?? 0).toDouble(); return v > 0 && v <= _kLow; }).length,
    'out' => _stock.where((s) => (s['inHand'] as num? ?? 0) <= 0).length,
    _     => _stock.length,
  };

  @override
  Widget build(BuildContext context) {
    final cs       = Theme.of(context).colorScheme;
    final filtered = _filtered;
    final maxStock = _stock.fold<double>(1, (m, s) => (s['inHand'] as num? ?? 0).toDouble() > m ? (s['inHand'] as num).toDouble() : m);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
      ),
      body: Column(children: [
        // ── Search ──
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Search products…',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),

        // ── Filter chips ──
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _FilterChip(label: 'All',         count: _count('all'), color: const Color(0xFF0097A7), active: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
              const SizedBox(width: 8),
              _FilterChip(label: 'In Stock',    count: _count('ok'),  color: const Color(0xFF2E9E4F), active: _filter == 'ok',  onTap: () => setState(() => _filter = 'ok')),
              const SizedBox(width: 8),
              _FilterChip(label: 'Low Stock',   count: _count('low'), color: const Color(0xFFFB8C00), active: _filter == 'low', onTap: () => setState(() => _filter = 'low')),
              const SizedBox(width: 8),
              _FilterChip(label: 'Out of Stock',count: _count('out'), color: const Color(0xFFE53935), active: _filter == 'out', onTap: () => setState(() => _filter = 'out')),
            ]),
          ),
        ),

        // ── Summary tiles ──
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          child: Row(children: [
            _SummaryTile(count: _count('ok'),  label: 'In Stock',     color: const Color(0xFF2E9E4F), active: _filter == 'ok',  onTap: () => setState(() => _filter = 'ok')),
            const SizedBox(width: 10),
            _SummaryTile(count: _count('low'), label: 'Low Stock',    color: const Color(0xFFFB8C00), active: _filter == 'low', onTap: () => setState(() => _filter = 'low')),
            const SizedBox(width: 10),
            _SummaryTile(count: _count('out'), label: 'Out of Stock', color: const Color(0xFFE53935), active: _filter == 'out', onTap: () => setState(() => _filter = 'out')),
          ]),
        ),

        const SizedBox(height: 10),

        // ── List ──
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () async { HapticFeedback.mediumImpact(); await _load(); },
                  child: filtered.isEmpty
                      ? Center(child: Text(
                          _search.isNotEmpty ? 'No results for "$_search"' : 'No products in this category',
                          style: TextStyle(color: cs.onSurface.withValues(alpha: 0.4), fontSize: 13),
                        ))
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) => _StockItem(
                            data: filtered[i] as Map<String, dynamic>,
                            maxStock: maxStock,
                            index: i,
                          ),
                        ),
                ),
        ),
      ]),
    );
  }
}
