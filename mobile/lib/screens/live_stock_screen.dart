import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/dispatch_provider.dart';
import '../providers/sales_provider.dart';

class LiveStockScreen extends StatefulWidget {
  const LiveStockScreen({super.key});
  @override
  State<LiveStockScreen> createState() => _LiveStockScreenState();
}

class _LiveStockScreenState extends State<LiveStockScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  void _load() {
    final session = context.read<DispatchProvider>().session;
    if (session != null) context.read<SalesProvider>().loadLiveStock(session.id);
  }

  Color _stockColor(int qty) {
    if (qty <= 0)  return const Color(0xFFDC2626);
    if (qty <= 5)  return const Color(0xFFD97706);
    return const Color(0xFF059669);
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<DispatchProvider>().session;
    final sp      = context.watch<SalesProvider>();

    if (session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Stock')),
        body: const Center(child: Text('No active session')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Live Stock', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Color(0xFF6B7280)),
            onPressed: _load,
          ),
        ],
      ),
      body: sp.loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : RefreshIndicator(
              color: const Color(0xFF4F46E5),
              onRefresh: () async => _load(),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: sp.liveStock.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final item = sp.liveStock[i];
                  final qty  = item['availableQty'] as int? ?? 0;
                  return Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      child: Row(children: [
                        Container(
                          width: 4, height: 40,
                          decoration: BoxDecoration(color: _stockColor(qty), borderRadius: BorderRadius.circular(2)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(item['productName'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
                          const SizedBox(height: 2),
                          Text('Loaded: ${item['loadedQty']}  •  Sold: ${item['soldQty']}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                        ])),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text('$qty', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _stockColor(qty))),
                          Text(qty <= 0 ? 'OUT' : qty <= 5 ? 'LOW' : 'OK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _stockColor(qty))),
                        ]),
                      ]),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
