import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'sales_entry_screen.dart';
import 'sales_profile_screen.dart';

class SalesUserShell extends StatefulWidget {
  const SalesUserShell({super.key});
  @override
  State<SalesUserShell> createState() => _SalesUserShellState();
}

class _SalesUserShellState extends State<SalesUserShell> {
  int _index = 0;

  static const _screens = [
    SalesEntryScreen(),
    SalesProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kulfi ICE'),
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
              Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0A1219) : Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _navItem(0, Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Sales', cs),
                _navItem(1, Icons.person_rounded, Icons.person_outline_rounded, 'Profile', cs),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int i, IconData activeIcon, IconData inactiveIcon, String label, ColorScheme cs) {
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
            Icon(selected ? activeIcon : inactiveIcon, color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4), size: 24),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4))),
          ]),
        ),
      ),
    );
  }
}
