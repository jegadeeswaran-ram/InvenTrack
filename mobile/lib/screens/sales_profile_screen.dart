import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';

class SalesProfileScreen extends StatelessWidget {
  const SalesProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final user = context.watch<AuthService>().user;
    final isDark = context.watch<ThemeNotifier>().isDark;
    final name = user?.name ?? 'User';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              Container(
                width: 90, height: 90,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF0097A7), Color(0xFF00BFA5)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: const Color(0xFF0097A7).withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: Center(child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800))),
              ),
              const SizedBox(height: 16),
              Text(name, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: cs.onSurface)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(color: const Color(0xFF0097A7).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                child: const Text('Sales Team', style: TextStyle(color: Color(0xFF0097A7), fontWeight: FontWeight.w600, fontSize: 13)),
              ),
              const SizedBox(height: 32),
              _tile(context, icon: Icons.dark_mode_outlined, label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', trailing: Switch(
                value: isDark,
                thumbColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return const Color(0xFF0097A7);
                  }
                  return null;
                }),
                onChanged: (_) => context.read<ThemeNotifier>().toggle(),
              )),
              const SizedBox(height: 10),
              _tile(context, icon: Icons.logout_rounded, label: 'Logout', iconColor: Colors.red, onTap: () async {
                await context.read<AuthService>().logout();
                if (!context.mounted) return;
                Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, {required IconData icon, required String label, Color? iconColor, Widget? trailing, VoidCallback? onTap}) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        leading: Container(
          width: 38, height: 38,
          decoration: BoxDecoration(color: (iconColor ?? const Color(0xFF0097A7)).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: iconColor ?? const Color(0xFF0097A7), size: 20),
        ),
        title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: iconColor ?? cs.onSurface)),
        trailing: trailing ?? (onTap != null ? Icon(Icons.chevron_right_rounded, color: cs.onSurface.withValues(alpha: 0.3)) : null),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
