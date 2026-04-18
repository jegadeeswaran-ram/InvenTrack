import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import '../screens/admin/dashboard_screen.dart';
import '../screens/admin/reports_screen.dart';
import '../screens/admin/products_screen.dart';
import '../screens/admin/media_screen.dart';
import '../screens/admin/users_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  void _go(BuildContext context, Widget screen) {
    Navigator.pop(context);
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
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
            // Header
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
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'A', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                Text(email, style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12)),
              ]),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _tile(context, icon: Icons.grid_view_outlined, label: 'Dashboard', onTap: () => _go(context, const DashboardScreen())),
                  _tile(context, icon: Icons.bar_chart_outlined, label: 'Reports', onTap: () => _go(context, const ReportsScreen())),
                  _tile(context, icon: Icons.sell_outlined, label: 'Products', onTap: () => _go(context, const ProductsScreen())),
                  _tile(context, icon: Icons.photo_library_outlined, label: 'Media', onTap: () => _go(context, const MediaScreen())),
                  _tile(context, icon: Icons.people_outline_rounded, label: 'Users', onTap: () => _go(context, const UsersScreen())),
                ],
              ),
            ),
            Divider(color: cs.onSurface.withOpacity(0.08)),
            // Theme toggle
            ListTile(
              leading: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, color: cs.onSurface.withOpacity(0.6)),
              title: Text(isDark ? 'Light Mode' : 'Dark Mode', style: TextStyle(color: cs.onSurface, fontSize: 14)),
              onTap: () => context.read<ThemeNotifier>().toggle(),
            ),
            // Logout
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

  Widget _tile(BuildContext context, {required IconData icon, required String label, required VoidCallback onTap}) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF0097A7), size: 22),
      title: Text(label, style: TextStyle(color: cs.onSurface, fontSize: 14, fontWeight: FontWeight.w500)),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      horizontalTitleGap: 12,
    );
  }
}
