import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/truck_service.dart';
import 'truck_pos_screen.dart';
import 'truck_end_day_screen.dart';
import 'truck_summary_screen.dart';

class TruckDashboardScreen extends StatefulWidget {
  const TruckDashboardScreen({super.key});
  @override
  State<TruckDashboardScreen> createState() => _TruckDashboardScreenState();
}

class _TruckDashboardScreenState extends State<TruckDashboardScreen> {
  Map<String, dynamic>? _session;
  bool _loading = true;
  List<dynamic> _trucks = [];
  List<dynamic> _branches = [];
  int? _selectedTruckId;
  int? _selectedBranchId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthService>().token!;
    final user = context.read<AuthService>().user!;
    try {
      final results = await Future.wait([
        TruckService.getTodaySession(token),
        TruckService.getBranches(token),
        TruckService.getTrucks(token),
      ]);
      if (!mounted) return;
      setState(() {
        _session = results[0] as Map<String, dynamic>?;
        _branches = results[1] as List<dynamic>;
        _trucks = results[2] as List<dynamic>;
        // Pre-select user's branch
        _selectedBranchId = user.branchId ?? (_branches.isNotEmpty ? _branches[0]['id'] : null);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startDay() async {
    if (_selectedTruckId == null || _selectedBranchId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a truck and branch')),
      );
      return;
    }
    final token = context.read<AuthService>().token!;
    try {
      final result = await TruckService.startDay(token, _selectedTruckId!, _selectedBranchId!);
      if (!mounted) return;
      setState(() => _session = result['session']);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['alreadyOpen'] == true ? 'Resuming existing session' : 'Day started!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final hasOpenSession = _session != null && _session!['status'] == 'OPEN';
    final hasClosedSession = _session != null && _session!['status'] == 'CLOSED';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Session status card
          _StatusCard(session: _session, isDark: isDark, cs: cs),
          const SizedBox(height: 20),

          // Start Day section
          if (_session == null) ...[
            Text('Start Your Day', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 12),
            _buildDropdown('Select Branch', _branches, _selectedBranchId, 'name',
                (v) => setState(() => _selectedBranchId = v), isDark, cs),
            const SizedBox(height: 10),
            _buildDropdown(
              'Select Truck',
              _trucks.where((t) => _selectedBranchId == null || t['branchId'] == _selectedBranchId).toList(),
              _selectedTruckId,
              'name',
              (v) => setState(() => _selectedTruckId = v),
              isDark,
              cs,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _startDay,
              icon: const Icon(Icons.play_circle_outline_rounded),
              label: const Text('Start Day'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
            ),
          ],

          // Actions for open session
          if (hasOpenSession) ...[
            const SizedBox(height: 8),
            Text('Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.point_of_sale_rounded,
              label: 'New Sale',
              subtitle: 'Add a sale transaction',
              color: cs.primary,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TruckPosScreen(session: _session!),
              )).then((_) => _load()),
            ),
            const SizedBox(height: 10),
            _ActionCard(
              icon: Icons.receipt_long_rounded,
              label: 'View Summary',
              subtitle: 'See today\'s sales',
              color: Colors.blue,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TruckSummaryScreen(session: _session!),
              )),
            ),
            const SizedBox(height: 10),
            _ActionCard(
              icon: Icons.inventory_2_rounded,
              label: 'End Day & Close',
              subtitle: 'Enter closing stock',
              color: Colors.orange,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TruckEndDayScreen(session: _session!),
              )).then((_) => _load()),
            ),
          ],

          // Closed session view
          if (hasClosedSession) ...[
            const SizedBox(height: 8),
            _ActionCard(
              icon: Icons.bar_chart_rounded,
              label: 'View Day Report',
              subtitle: 'Today\'s closed session summary',
              color: cs.primary,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TruckSummaryScreen(session: _session!),
              )),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDropdown(String hint, List<dynamic> items, int? value, String labelKey,
      ValueChanged<int?> onChanged, bool isDark, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isDark ? const Color(0xFF2E3E50) : const Color(0xFFDDE3EA)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          hint: Text(hint, style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5), fontSize: 14)),
          isExpanded: true,
          dropdownColor: isDark ? const Color(0xFF1A2635) : Colors.white,
          items: items.map<DropdownMenuItem<int>>((item) {
            return DropdownMenuItem<int>(
              value: item['id'] as int,
              child: Text(item[labelKey] as String, style: const TextStyle(fontSize: 14)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final Map<String, dynamic>? session;
  final bool isDark;
  final ColorScheme cs;

  const _StatusCard({required this.session, required this.isDark, required this.cs});

  @override
  Widget build(BuildContext context) {
    if (session == null) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A2635) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.orange.withValues(alpha: 0.4)),
        ),
        child: Row(children: [
          const Icon(Icons.wb_sunny_outlined, color: Colors.orange, size: 28),
          const SizedBox(width: 14),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('No active session', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            Text('Start your day to begin selling', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
          ]),
        ]),
      );
    }

    final isOpen = session!['status'] == 'OPEN';
    final truck = session!['truck'];
    final branch = session!['branch'];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2635) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: (isOpen ? Colors.green : cs.primary).withValues(alpha: 0.4)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(isOpen ? Icons.local_shipping_rounded : Icons.check_circle_rounded,
              color: isOpen ? Colors.green : cs.primary, size: 24),
          const SizedBox(width: 10),
          Text(isOpen ? 'Session Active' : 'Session Closed',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15,
                  color: isOpen ? Colors.green : cs.primary)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: (isOpen ? Colors.green : cs.primary).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(isOpen ? 'OPEN' : 'CLOSED',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                    color: isOpen ? Colors.green : cs.primary)),
          ),
        ]),
        if (truck != null || branch != null) ...[
          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 10),
          if (truck != null)
            _infoRow(Icons.local_shipping_outlined, '${truck['name']}${truck['plateNo'] != null ? ' · ${truck['plateNo']}' : ''}'),
          if (branch != null) _infoRow(Icons.store_outlined, branch['name'] as String),
        ],
      ]),
    );
  }

  Widget _infoRow(IconData icon, String text) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(children: [
      Icon(icon, size: 14, color: cs.onSurface.withValues(alpha: 0.5)),
      const SizedBox(width: 6),
      Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.8)))),
    ]),
  );
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A2635) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Row(children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            Text(subtitle, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ])),
          Icon(Icons.arrow_forward_ios_rounded, size: 14, color: color.withValues(alpha: 0.7)),
        ]),
      ),
    );
  }
}
