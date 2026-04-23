import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'purchase_screen.dart';
import 'sales_screen.dart';
import 'stock_screen.dart';
import 'settings_screen.dart';
import 'reports_screen.dart';
import 'products_screen.dart';
import 'media_screen.dart';
import 'users_screen.dart';
import 'profile_screen.dart';

// Bottom nav indices
const int _kDashboard = 0;
// Drawer-only indices (not shown in bottom nav)
const int _kReports   = 5;
const int _kProducts  = 6;
const int _kMedia     = 7;
const int _kUsers     = 8;

/// Lets any descendant widget open the AdminShell's drawer.
class ShellScope extends InheritedWidget {
  final GlobalKey<ScaffoldState> scaffoldKey;

  const ShellScope({super.key, required this.scaffoldKey, required super.child});

  static ShellScope? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShellScope>();

  @override
  bool updateShouldNotify(ShellScope old) => scaffoldKey != old.scaffoldKey;
}

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _selectedIndex = _kDashboard;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  void _navigateTo(int index) => setState(() => _selectedIndex = index);

  static const _screens = [
    DashboardScreen(),   // 0
    PurchaseScreen(),    // 1
    AdminSalesScreen(),  // 2
    StockScreen(),       // 3
    SettingsScreen(),    // 4
    ReportsScreen(),     // 5
    ProductsScreen(),    // 6
    MediaScreen(),       // 7
    UsersScreen(),       // 8
  ];

  // Returns the bottom nav index to highlight, or -1 for drawer-only screens
  int get _bottomNavIndex => _selectedIndex <= 4 ? _selectedIndex : -1;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    return ShellScope(
      scaffoldKey: _scaffoldKey,
      child: Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawerShell(onNavigate: _navigateTo, currentIndex: _selectedIndex),
      body: Material(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: IndexedStack(index: _selectedIndex, children: _screens),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          )],
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex < 0 ? 0 : _bottomNavIndex,
          onTap: _navigateTo,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), activeIcon: Icon(Icons.grid_view_rounded), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.shopping_cart_outlined), activeIcon: Icon(Icons.shopping_cart_rounded), label: 'Purchase'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long_rounded), label: 'Sales'),
            BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2_rounded), label: 'Stock'),
            BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), activeIcon: Icon(Icons.settings_rounded), label: 'Settings'),
          ],
        ),
      ),
    ));
  }
}

class AppDrawerShell extends StatelessWidget {
  final void Function(int index) onNavigate;
  final int currentIndex;

  const AppDrawerShell({super.key, required this.onNavigate, required this.currentIndex});

  void _go(BuildContext context, int index) {
    Navigator.pop(context); // close drawer
    onNavigate(index);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;
    final user = context.read<AuthService>().user;
    final name = user?.name ?? 'Admin';
    final email = user?.username ?? '';

    return Drawer(
      backgroundColor: cs.surface,
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFF0097A7),
                borderRadius: BorderRadius.only(bottomRight: Radius.circular(20)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                  child: Text(name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'A', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                Text(email, style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12)),
              ]),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _tile(context, icon: Icons.grid_view_outlined,      label: 'Dashboard', index: _kDashboard),
                  _tile(context, icon: Icons.bar_chart_outlined,       label: 'Reports',   index: _kReports),
                  _tile(context, icon: Icons.sell_outlined,            label: 'Products',  index: _kProducts),
                  _tile(context, icon: Icons.photo_library_outlined,   label: 'Media',     index: _kMedia),
                  _tile(context, icon: Icons.people_outline_rounded,   label: 'Users',     index: _kUsers),
                  _profileTile(context),
                ],
              ),
            ),
            Divider(color: cs.onSurface.withValues(alpha: 0.08)),
            ListTile(
              leading: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, color: cs.onSurface.withValues(alpha: 0.6)),
              title: Text(isDark ? 'Light Mode' : 'Dark Mode', style: TextStyle(color: cs.onSurface, fontSize: 14)),
              onTap: () => context.read<ThemeNotifier>().toggle(),
            ),
            ListTile(
              leading: const Icon(Icons.logout_outlined, color: Color(0xFFE53935)),
              title: const Text('Logout', style: TextStyle(color: Color(0xFFE53935), fontSize: 14)),
              onTap: () async {
                Navigator.pop(context);
                await context.read<AuthService>().logout();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _profileTile(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(Icons.manage_accounts_outlined, color: cs.onSurface.withValues(alpha: 0.6), size: 22),
      title: Text('My Profile', style: TextStyle(color: cs.onSurface, fontSize: 14, fontWeight: FontWeight.w500)),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      horizontalTitleGap: 12,
    );
  }

  Widget _tile(BuildContext context, {required IconData icon, required String label, required int index}) {
    final cs = Theme.of(context).colorScheme;
    final isActive = currentIndex == index;
    return ListTile(
      leading: Icon(icon, color: isActive ? const Color(0xFF0097A7) : cs.onSurface.withValues(alpha: 0.6), size: 22),
      title: Text(label, style: TextStyle(color: isActive ? const Color(0xFF0097A7) : cs.onSurface, fontSize: 14, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500)),
      tileColor: isActive ? const Color(0xFF0097A7).withValues(alpha: 0.08) : null,
      onTap: () => _go(context, index),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      horizontalTitleGap: 12,
    );
  }
}
