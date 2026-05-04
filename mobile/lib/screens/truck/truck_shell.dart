import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/truck_service.dart';
import '../login_screen.dart';
import 'truck_dashboard_screen.dart';
import 'truck_summary_screen.dart';

class TruckShell extends StatefulWidget {
  const TruckShell({super.key});
  @override
  State<TruckShell> createState() => _TruckShellState();
}

class _TruckShellState extends State<TruckShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;

    return Scaffold(
      appBar: AppBar(
        title: Text(_index == 0 ? 'Truck Sales' : 'My Sales'),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => context.read<ThemeNotifier>().toggle(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
            onPressed: () async {
              await context.read<AuthService>().logout();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          TruckDashboardScreen(),
          _SummaryTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0A1219) : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(children: [
              _navItem(0, Icons.local_shipping_rounded, Icons.local_shipping_outlined, 'Dashboard', cs),
              _navItem(1, Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Sales', cs),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int i, IconData active, IconData inactive, String label, ColorScheme cs) {
    final selected = _index == i;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _index = i),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? cs.primary.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(selected ? active : inactive,
                color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4), size: 24),
            const SizedBox(height: 3),
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4))),
          ]),
        ),
      ),
    );
  }
}

class _SummaryTab extends StatefulWidget {
  const _SummaryTab();
  @override
  State<_SummaryTab> createState() => _SummaryTabState();
}

class _SummaryTabState extends State<_SummaryTab> {
  Map<String, dynamic>? _session;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthService>().token!;
    try {
      final session = await TruckService.getTodaySession(token);
      if (mounted) setState(() { _session = session; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_session == null) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.receipt_long_outlined, size: 56, color: cs.onSurface.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          const Text('No session today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text('Start your day from the Dashboard tab',
              style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.5))),
          const SizedBox(height: 20),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Refresh'),
          ),
        ]),
      );
    }

    return TruckSummaryScreen(session: _session!);
  }
}
