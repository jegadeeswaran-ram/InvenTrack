import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'sales_entry_screen.dart';
import 'sales_profile_screen.dart';
import 'truck/truck_dashboard_screen.dart';

class SalesUserShell extends StatefulWidget {
  const SalesUserShell({super.key});
  @override
  State<SalesUserShell> createState() => _SalesUserShellState();
}

class _SalesUserShellState extends State<SalesUserShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    final cs = Theme.of(context).colorScheme;
    final auth = context.watch<AuthService>();
    final hasTruck = auth.user?.truckId != null;

    final screens = [
      if (hasTruck) const TruckDashboardScreen(),
      const SalesEntryScreen(),
      const SalesProfileScreen(),
    ];

    final navItems = [
      if (hasTruck) const _NavItem(Icons.local_shipping_rounded, Icons.local_shipping_outlined, 'Truck'),
      const _NavItem(Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Sales'),
      const _NavItem(Icons.person_rounded, Icons.person_outline_rounded, 'Profile'),
    ];

    // Clamp index in case screen count changes
    final safeIndex = _index.clamp(0, screens.length - 1);

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
      body: Material(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: IndexedStack(index: safeIndex, children: screens),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0A1219) : Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: navItems.asMap().entries.map((entry) {
                return _buildNavItem(entry.key, entry.value, safeIndex, cs);
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int i, _NavItem item, int currentIndex, ColorScheme cs) {
    final selected = currentIndex == i;
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
            Icon(selected ? item.activeIcon : item.inactiveIcon,
                color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4), size: 24),
            const SizedBox(height: 3),
            Text(item.label,
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

class _NavItem {
  final IconData activeIcon;
  final IconData inactiveIcon;
  final String label;
  const _NavItem(this.activeIcon, this.inactiveIcon, this.label);
}
