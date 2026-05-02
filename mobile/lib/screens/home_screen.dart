import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dispatch_provider.dart';
import '../config/routes.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DispatchProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user    = context.watch<AuthProvider>().user;
    final dp      = context.watch<DispatchProvider>();
    final session = dp.session;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('InvenTrack', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            Text('Welcome, ${user?.name ?? ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined, color: Color(0xFF6B7280)),
            onPressed: () async {
              final nav = Navigator.of(context);
              await context.read<AuthProvider>().logout();
              nav.pushReplacementNamed(AppRoutes.login);
            },
          ),
        ],
      ),
      body: dp.loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : RefreshIndicator(
              color: const Color(0xFF4F46E5),
              onRefresh: () => context.read<DispatchProvider>().load(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (session != null) ...[
                    _SessionCard(session: session),
                    const SizedBox(height: 16),
                  ] else ...[
                    _NoSessionCard(),
                    const SizedBox(height: 16),
                  ],
                  const Text('Quick Actions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF374151))),
                  const SizedBox(height: 12),
                  _ActionGrid(session: session),
                ],
              ),
            ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final dynamic session;
  const _SessionCard({required this.session});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE5E7EB))),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.local_shipping_outlined, color: Color(0xFF4F46E5), size: 18),
              const SizedBox(width: 8),
              const Text('Today\'s Session', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(20)),
                child: Text(session.status, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF4F46E5))),
              ),
            ]),
            const SizedBox(height: 10),
            Text('Truck: ${session.truckId ?? 'N/A'}', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
            const SizedBox(height: 4),
            Text('${session.items.length} products loaded', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }
}

class _NoSessionCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE5E7EB))),
      child: const Padding(
        padding: EdgeInsets.all(20),
        child: Column(children: [
          Icon(Icons.inbox_outlined, size: 36, color: Color(0xFF9CA3AF)),
          SizedBox(height: 8),
          Text('No active session today', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          SizedBox(height: 4),
          Text('Contact your manager to dispatch stock', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        ]),
      ),
    );
  }
}

class _ActionGrid extends StatelessWidget {
  final dynamic session;
  const _ActionGrid({required this.session});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickAction('Record Sale', Icons.point_of_sale_outlined, const Color(0xFF4F46E5), AppRoutes.sales, session != null),
      _QuickAction('Live Stock', Icons.inventory_outlined, const Color(0xFF059669), AppRoutes.liveStock, session != null),
      _QuickAction('Day Closing', Icons.check_circle_outline, const Color(0xFFD97706), AppRoutes.closing, session != null),
      const _QuickAction('My Profile', Icons.person_outline, Color(0xFF7C3AED), AppRoutes.profile, true),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: actions.map((a) => _ActionTile(action: a)).toList(),
    );
  }
}

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final String route;
  final bool enabled;
  const _QuickAction(this.label, this.icon, this.color, this.route, this.enabled);
}

class _ActionTile extends StatelessWidget {
  final _QuickAction action;
  const _ActionTile({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: action.enabled ? () => Navigator.pushNamed(context, action.route) : null,
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE5E7EB))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(action.icon, color: action.enabled ? action.color : const Color(0xFF9CA3AF), size: 26),
              const SizedBox(height: 8),
              Text(
                action.label,
                style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600,
                  color: action.enabled ? const Color(0xFF111827) : const Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
