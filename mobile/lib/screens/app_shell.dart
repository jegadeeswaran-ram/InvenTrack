import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import '../services/permission_service.dart';
import 'shell_scope.dart';
import 'login_screen.dart';
// Admin screens
import 'admin/dashboard_screen.dart';
import 'admin/purchase_screen.dart';
import 'admin/sales_screen.dart';
import 'admin/stock_screen.dart';
import 'admin/settings_screen.dart';
import 'admin/reports_screen.dart';
import 'admin/products_screen.dart';
import 'admin/media_screen.dart';
import 'admin/users_screen.dart';
import 'admin/profile_screen.dart';
import 'admin/expenses_screen.dart';
import 'admin/branches_screen.dart';
import 'admin/trucks_screen.dart';
// Sales / Truck screens
import 'sales_entry_screen.dart';
import 'truck/truck_dashboard_screen.dart';
import 'truck/truck_sessions_screen.dart';

// ── Module catalog (defines order + display) ─────────────────────────────────

class _Mod {
  final String key;
  final String label;
  final IconData icon;
  final IconData activeIcon;
  const _Mod(this.key, this.label, this.icon, this.activeIcon);
}

const _kModules = <_Mod>[
  _Mod('dashboard',      'Dashboard', Icons.grid_view_outlined,            Icons.grid_view_rounded),
  _Mod('purchase',       'Purchase',  Icons.shopping_cart_outlined,        Icons.shopping_cart_rounded),
  _Mod('sales',          'Sales',     Icons.receipt_long_outlined,         Icons.receipt_long_rounded),
  _Mod('truck-sessions', 'Truck',     Icons.local_shipping_outlined,       Icons.local_shipping_rounded),
  _Mod('stock',          'Stock',     Icons.inventory_2_outlined,          Icons.inventory_2_rounded),
  _Mod('reports',        'Reports',   Icons.bar_chart_outlined,            Icons.bar_chart_rounded),
  _Mod('expenses',       'Expenses',  Icons.money_off_outlined,            Icons.money_off_rounded),
  _Mod('bulk-orders',    'Orders',    Icons.list_alt_outlined,             Icons.list_alt_rounded),
  _Mod('products',       'Products',  Icons.sell_outlined,                 Icons.sell_rounded),
  _Mod('settings',       'Settings',  Icons.settings_outlined,             Icons.settings_rounded),
  _Mod('branches',       'Branches',  Icons.store_mall_directory_outlined, Icons.store_mall_directory_rounded),
  _Mod('trucks',         'Trucks',    Icons.rv_hookup_outlined,            Icons.rv_hookup_rounded),
  _Mod('media',          'Media',     Icons.photo_library_outlined,        Icons.photo_library_rounded),
];

// Modules eligible for bottom nav, in priority order
const _kBottomNavKeys = [
  'dashboard', 'purchase', 'sales', 'truck-sessions',
  'stock', 'settings', 'reports', 'expenses',
];

// ── Screen factory ────────────────────────────────────────────────────────────

Widget _screenFor(String key, AuthUser user) {
  final isTruck = user.saleType == 'TRUCK';
  switch (key) {
    case 'dashboard':      return const DashboardScreen();
    case 'purchase':       return const PurchaseScreen();
    case 'sales':
      if (isTruck)              return const TruckDashboardScreen();
      if (user.role == 'SALES') return const _SalesWrapper();
      return const AdminSalesScreen();
    case 'truck-sessions':
      if (isTruck) return const TruckDashboardScreen();
      return const TruckSessionsScreen();
    case 'stock':          return const StockScreen();
    case 'reports':        return const ReportsScreen();
    case 'products':       return const ProductsScreen();
    case 'settings':       return const SettingsScreen();
    case 'media':          return const MediaScreen();
    case 'expenses':       return const ExpensesScreen();
    case 'branches':       return const BranchesScreen();
    case 'trucks':         return const TrucksScreen();
    default:               return _ComingSoonScreen(module: key);
  }
}

// ── AppShell ──────────────────────────────────────────────────────────────────

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _idx = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  // Modules visible to this user based on permissions
  List<_Mod> _visible(PermissionService perms, AuthUser user) {
    final isTruck = user.saleType == 'TRUCK';
    return _kModules.where((m) {
      if (!perms.canView(m.key)) return false;
      if (isTruck && m.key == 'sales')    return false;
      if (isTruck && m.key == 'stock')    return false;
      if (isTruck && m.key == 'products') return false;
      return true;
    }).toList();
  }

  // Subset of visible modules that appear in the bottom nav (max 5)
  List<_Mod> _bottomNav(List<_Mod> visible, AuthUser user) {
    final isTruck = user.saleType == 'TRUCK';
    return visible.where((m) {
      if (!_kBottomNavKeys.contains(m.key)) return false;
      // truck-sessions only in bottom nav for actual truck users
      if (m.key == 'truck-sessions' && !isTruck) return false;
      return true;
    }).take(5).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthService>();
    final perms = context.watch<PermissionService>();

    if (!perms.loaded) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final user    = auth.user!;
    final visible = _visible(perms, user);
    final bnMods  = _bottomNav(visible, user);

    if (visible.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('InvenTrack')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: Text(
              'No modules are assigned to your account.\nPlease contact your administrator.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: Color(0xFF607D8B)),
            ),
          ),
        ),
      );
    }

    final safeIdx = _idx.clamp(0, visible.length - 1);
    final screens = visible.map((m) => _screenFor(m.key, user)).toList();
    final bnIdx   = bnMods.indexWhere((m) => m.key == visible[safeIdx].key);

    return ShellScope(
      scaffoldKey: _scaffoldKey,
      child: Scaffold(
        key: _scaffoldKey,
        drawer: _AppDrawer(
          visible: visible,
          currentIdx: safeIdx,
          user: user,
          onNavigate: (i) {
            Navigator.pop(context);
            setState(() => _idx = i);
          },
        ),
        body: IndexedStack(index: safeIdx, children: screens),
        bottomNavigationBar:
            bnMods.length < 2 ? null : _buildNav(bnMods, bnIdx, visible, context),
      ),
    );
  }

  Widget _buildNav(
    List<_Mod> bnMods, int bnIdx, List<_Mod> visible, BuildContext ctx) {
    final isDark = ctx.watch<ThemeNotifier>().isDark;
    final cs     = Theme.of(ctx).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A1219) : Colors.white,
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
          blurRadius: 20,
          offset: const Offset(0, -4),
        )],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: bnMods.asMap().entries.map((e) {
              final i        = e.key;
              final m        = e.value;
              final selected = bnIdx == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    final gi = visible.indexWhere((v) => v.key == m.key);
                    if (gi >= 0) setState(() => _idx = gi);
                  },
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: selected
                          ? cs.primary.withValues(alpha: 0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(
                        selected ? m.activeIcon : m.icon,
                        color: selected
                            ? cs.primary
                            : cs.onSurface.withValues(alpha: 0.4),
                        size: 24,
                      ),
                      const SizedBox(height: 3),
                      Text(m.label, style: TextStyle(
                        fontSize: 10,
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected
                            ? cs.primary
                            : cs.onSurface.withValues(alpha: 0.4),
                      )),
                    ]),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

// ── Drawer ────────────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  final List<_Mod> visible;
  final int currentIdx;
  final AuthUser user;
  final void Function(int) onNavigate;

  const _AppDrawer({
    required this.visible,
    required this.currentIdx,
    required this.user,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final cs     = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;

    return Drawer(
      backgroundColor: cs.surface,
      child: SafeArea(
        child: Column(children: [
          // ── Header ──
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
                child: Text(
                  user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 10),
              Text(user.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Wrap(spacing: 6, children: [
                _badge(user.role, _roleColor(user.role)),
                if (user.saleType == 'TRUCK') _badge('🚚 Truck', Colors.orange),
                if (user.saleType == 'SHOP' && user.role == 'SALES') _badge('🏪 Shop', Colors.blue),
              ]),
            ]),
          ),
          const SizedBox(height: 8),
          // ── Module list ──
          Expanded(
            child: ListView(padding: EdgeInsets.zero, children: [
              ...visible.asMap().entries.map((e) => _modTile(context, e.key, e.value)),
              if (user.role == 'ADMIN')
                _pushTile(context, Icons.people_outline_rounded, 'Users', const UsersScreen()),
              _pushTile(context, Icons.manage_accounts_outlined, 'My Profile', const ProfileScreen()),
            ]),
          ),
          Divider(color: cs.onSurface.withValues(alpha: 0.08)),
          ListTile(
            leading: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: cs.onSurface.withValues(alpha: 0.6)),
            title: Text(isDark ? 'Light Mode' : 'Dark Mode',
                style: TextStyle(color: cs.onSurface, fontSize: 14)),
            onTap: () => context.read<ThemeNotifier>().toggle(),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          ListTile(
            leading: const Icon(Icons.logout_outlined, color: Color(0xFFE53935)),
            title: const Text('Logout', style: TextStyle(color: Color(0xFFE53935), fontSize: 14)),
            onTap: () async {
              Navigator.pop(context);
              context.read<PermissionService>().clear();
              await context.read<AuthService>().logout();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  Widget _modTile(BuildContext context, int index, _Mod mod) {
    final cs       = Theme.of(context).colorScheme;
    final isActive = currentIdx == index;
    return ListTile(
      leading: Icon(
        isActive ? mod.activeIcon : mod.icon,
        color: isActive ? const Color(0xFF0097A7) : cs.onSurface.withValues(alpha: 0.6),
        size: 22,
      ),
      title: Text(mod.label, style: TextStyle(
        color: isActive ? const Color(0xFF0097A7) : cs.onSurface,
        fontSize: 14,
        fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
      )),
      tileColor: isActive ? const Color(0xFF0097A7).withValues(alpha: 0.08) : null,
      onTap: () => onNavigate(index),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      horizontalTitleGap: 12,
    );
  }

  Widget _pushTile(BuildContext context, IconData icon, String label, Widget target) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: cs.onSurface.withValues(alpha: 0.6), size: 22),
      title: Text(label, style: TextStyle(color: cs.onSurface, fontSize: 14, fontWeight: FontWeight.w500)),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(context, MaterialPageRoute(builder: (_) => target));
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      horizontalTitleGap: 12,
    );
  }

  Widget _badge(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.25),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
    ),
    child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
  );

  Color _roleColor(String role) {
    switch (role) {
      case 'ADMIN':          return const Color(0xFF7C3AED);
      case 'BRANCH_MANAGER': return const Color(0xFF0EA5E9);
      case 'SALES':          return const Color(0xFF10B981);
      default:               return const Color(0xFF6B7280);
    }
  }
}

// ── SalesEntry wrapper (provides AppBar + drawer hamburger) ──────────────────

class _SalesWrapper extends StatelessWidget {
  const _SalesWrapper();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      body: const SalesEntryScreen(),
    );
  }
}

// ── Coming Soon placeholder ───────────────────────────────────────────────────

class _ComingSoonScreen extends StatelessWidget {
  final String module;
  const _ComingSoonScreen({required this.module});

  @override
  Widget build(BuildContext context) {
    final label = module[0].toUpperCase() + module.substring(1).replaceAll('-', ' ');
    return Scaffold(
      appBar: AppBar(
        title: Text(label),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.construction_outlined, size: 64, color: Color(0xFF90A4AE)),
          const SizedBox(height: 16),
          Text('$label\nis available on the web only',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Color(0xFF607D8B))),
        ]),
      ),
    );
  }
}
