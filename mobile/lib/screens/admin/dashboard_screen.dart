import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../login_screen.dart';
import 'admin_shell.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TickerProviderStateMixin {
  List<dynamic> _stock = [];
  Map<String, dynamic>? _daily;
  bool _loading = true;

  late AnimationController _cardsCtrl;
  late AnimationController _listCtrl;

  @override
  void initState() {
    super.initState();
    _cardsCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _listCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _load();
  }

  @override
  void dispose() {
    _cardsCtrl.dispose();
    _listCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final token = context.read<AuthService>().token;
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    try {
      final results = await Future.wait([
        ApiService.get('/reports/stock', token: token),
        ApiService.get('/reports/daily?date=$today', token: token),
      ]);
      setState(() { _stock = results[0]; _daily = results[1]; _loading = false; });
      _cardsCtrl.forward(from: 0);
      Future.delayed(const Duration(milliseconds: 300), () => _listCtrl.forward(from: 0));
    } catch (_) { setState(() => _loading = false); }
  }

  Widget _stockBadge(double inHand) {
    if (inHand <= 0) return _chip('Out', const Color(0xFFFFEBEE), const Color(0xFFB71C1C));
    if (inHand <= 20) return _chip('Low', const Color(0xFFFFF3E0), const Color(0xFFE65100));
    return _chip('Good', const Color(0xFFE8F5E9), const Color(0xFF2E7D32));
  }

  Widget _chip(String text, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(text, style: TextStyle(fontSize: 10, color: fg, fontWeight: FontWeight.w700)),
  );

  Widget _productAvatar(dynamic p) {
    final imageUrl = p['imageUrl'] as String?;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 22,
        backgroundImage: NetworkImage(imageUrl),
        backgroundColor: const Color(0xFFE0F7FA),
        onBackgroundImageError: (_, __) {},
      );
    }
    return CircleAvatar(
      radius: 22,
      backgroundColor: const Color(0xFFE0F7FA),
      child: const Icon(Icons.icecream_outlined, color: Color(0xFF0097A7), size: 20),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().user;
    final themeNotifier = context.watch<ThemeNotifier>();
    final summary = _daily?['summary'] ?? {};
    final cs = Theme.of(context).colorScheme;
    final todaySales = (_daily?['sales'] as List?) ?? [];
    final totalStock = _stock.fold<double>(0, (s, p) => s + ((p['inHand'] as num?)?.toDouble() ?? 0));

    final kpiData = [
      _KpiData(
        label: 'Stock in Hand',
        value: '${totalStock.toStringAsFixed(0)}',
        unit: 'units',
        icon: Icons.inventory_2_rounded,
        gradient: const [Color(0xFF0097A7), Color(0xFF00BFA5)],
      ),
      _KpiData(
        label: 'Purchased Today',
        value: '${(summary['unitsPurchased'] ?? 0).toStringAsFixed(0)}',
        unit: 'units',
        icon: Icons.shopping_cart_rounded,
        gradient: const [Color(0xFF5C6BC0), Color(0xFF7986CB)],
      ),
      _KpiData(
        label: 'Sales Today',
        value: '${(summary['unitsSold'] ?? 0).toStringAsFixed(0)}',
        unit: 'units',
        icon: Icons.receipt_long_rounded,
        gradient: const [Color(0xFFE65100), Color(0xFFFB8C00)],
      ),
      _KpiData(
        label: "Today's Profit",
        value: '₹${((summary['totalProfit'] ?? 0) as num).toStringAsFixed(0)}',
        unit: 'revenue',
        icon: Icons.trending_up_rounded,
        gradient: const [Color(0xFF2E7D32), Color(0xFF43A047)],
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        leading: IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer()),
        actions: [
          IconButton(
            icon: Icon(themeNotifier.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => context.read<ThemeNotifier>().toggle(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            onPressed: () async {
              await context.read<AuthService>().logout();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting
                    Row(children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Hello, ${user?.name ?? 'Admin'} 👋', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: cs.onSurface)),
                        const SizedBox(height: 2),
                        Text(DateFormat('EEEE, dd MMM yyyy').format(DateTime.now()), style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5), fontSize: 12)),
                      ])),
                    ]),
                    const SizedBox(height: 20),

                    // KPI Cards — 2×2 grid with staggered animation
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 1.05,
                      ),
                      itemCount: kpiData.length,
                      itemBuilder: (_, i) {
                        final delay = i * 0.15;
                        final anim = CurvedAnimation(
                          parent: _cardsCtrl,
                          curve: Interval(delay, math.min(delay + 0.6, 1.0), curve: Curves.easeOutBack),
                        );
                        return AnimatedBuilder(
                          animation: anim,
                          builder: (_, child) => Transform.scale(
                            scale: anim.value,
                            child: Opacity(opacity: anim.value.clamp(0.0, 1.0), child: child),
                          ),
                          child: _KpiCard(data: kpiData[i]),
                        );
                      },
                    ),
                    const SizedBox(height: 24),

                    // Available Stock section
                    _SectionHeader(title: 'Available Stock', icon: Icons.inventory_2_outlined),
                    const SizedBox(height: 10),
                    AnimatedBuilder(
                      animation: _listCtrl,
                      builder: (_, __) => Column(
                        children: _stock.asMap().entries.map((e) {
                          final i = e.key;
                          final p = e.value;
                          final delay = (i * 0.1).clamp(0.0, 0.9);
                          final anim = CurvedAnimation(
                            parent: _listCtrl,
                            curve: Interval(delay, math.min(delay + 0.5, 1.0), curve: Curves.easeOut),
                          );
                          final inHand = (p['inHand'] as num).toDouble();
                          return Transform.translate(
                            offset: Offset(0, 30 * (1 - anim.value)),
                            child: Opacity(
                              opacity: anim.value.clamp(0.0, 1.0),
                              child: _StockRow(p: p, inHand: inHand, badge: _stockBadge(inHand), avatar: _productAvatar(p), isLast: i == _stock.length - 1),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    // Today's Sales section
                    if (todaySales.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      _SectionHeader(title: "Today's Sales", icon: Icons.receipt_long_outlined),
                      const SizedBox(height: 10),
                      AnimatedBuilder(
                        animation: _listCtrl,
                        builder: (_, __) => Column(
                          children: todaySales.asMap().entries.map((e) {
                            final i = e.key;
                            final s = e.value;
                            final delay = (0.3 + i * 0.1).clamp(0.0, 0.9);
                            final anim = CurvedAnimation(
                              parent: _listCtrl,
                              curve: Interval(delay, math.min(delay + 0.5, 1.0), curve: Curves.easeOut),
                            );
                            final profit = (s['profit'] as num).toDouble();
                            return Transform.translate(
                              offset: Offset(0, 30 * (1 - anim.value)),
                              child: Opacity(
                                opacity: anim.value.clamp(0.0, 1.0),
                                child: _SaleRow(s: s, profit: profit, avatar: _productAvatar(s), isLast: i == todaySales.length - 1),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

// ── KPI Data model ─────────────────────────────────────────────────────────
class _KpiData {
  final String label, value, unit;
  final IconData icon;
  final List<Color> gradient;
  const _KpiData({required this.label, required this.value, required this.unit, required this.icon, required this.gradient});
}

// ── KPI Card widget ────────────────────────────────────────────────────────
class _KpiCard extends StatelessWidget {
  final _KpiData data;
  const _KpiCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: data.gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: data.gradient[0].withValues(alpha: 0.38), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Stack(
        children: [
          // Background circle decoration
          Positioned(
            right: -18, top: -18,
            child: Container(
              width: 90, height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          Positioned(
            right: 14, bottom: -24,
            child: Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.07),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Icon
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(data.icon, color: Colors.white, size: 26),
                ),
                const SizedBox(height: 12),
                // Value
                Text(
                  data.value,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, height: 1),
                ),
                const SizedBox(height: 4),
                // Label
                Text(
                  data.label,
                  style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section header ─────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      Icon(icon, size: 18, color: cs.primary),
      const SizedBox(width: 8),
      Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: cs.onSurface)),
    ]);
  }
}

// ── Stock row ──────────────────────────────────────────────────────────────
class _StockRow extends StatelessWidget {
  final dynamic p;
  final double inHand;
  final Widget badge, avatar;
  final bool isLast;
  const _StockRow({required this.p, required this.inHand, required this.badge, required this.avatar, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: EdgeInsets.only(bottom: isLast ? 0 : 10),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          avatar,
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p['productName'], style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: cs.onSurface)),
            const SizedBox(height: 3),
            Text('Avg ₹${(p['avgCostPerUnit'] as num).toStringAsFixed(2)}', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(inHand.toStringAsFixed(0), style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: cs.primary, height: 1)),
            const SizedBox(height: 4),
            badge,
          ]),
        ]),
      ),
    );
  }
}

// ── Sale row ───────────────────────────────────────────────────────────────
class _SaleRow extends StatelessWidget {
  final dynamic s;
  final double profit;
  final Widget avatar;
  final bool isLast;
  const _SaleRow({required this.s, required this.profit, required this.avatar, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: EdgeInsets.only(bottom: isLast ? 0 : 10),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          avatar,
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s['productName'] ?? '', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: cs.onSurface)),
            const SizedBox(height: 3),
            Text('${s['quantity']} units · ₹${(s['totalRevenue'] as num).toStringAsFixed(2)}', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('₹${profit.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: profit >= 0 ? const Color(0xFF2E9E4F) : const Color(0xFFE53935), height: 1)),
            const SizedBox(height: 3),
            Text('profit', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.4))),
          ]),
        ]),
      ),
    );
  }
}
