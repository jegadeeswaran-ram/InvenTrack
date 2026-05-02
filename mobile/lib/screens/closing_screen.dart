import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/dispatch_provider.dart';
import '../providers/closing_provider.dart';

class ClosingScreen extends StatefulWidget {
  const ClosingScreen({super.key});
  @override
  State<ClosingScreen> createState() => _ClosingScreenState();
}

class _ClosingScreenState extends State<ClosingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<DispatchProvider>().session;
      if (session != null) {
        context.read<ClosingProvider>().initFromSession(
          session.items.map((d) => {
            'productId':   d.productId,
            'product':     {'name': d.productName},
            'loadedQty':   d.loadedQty,
            'soldQty':     d.soldQty,
            'returnedQty': d.returnedQty,
          }).toList(),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<DispatchProvider>().session;
    final cp      = context.watch<ClosingProvider>();

    if (session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Day Closing')),
        body: const Center(child: Text('No active session')),
      );
    }

    if (cp.submitted) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(title: const Text('Day Closing'), backgroundColor: Colors.white, elevation: 0),
        body: const Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.check_circle_outline, size: 64, color: Color(0xFF059669)),
            SizedBox(height: 16),
            Text('Closing Submitted', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            SizedBox(height: 8),
            Text('Awaiting manager approval', style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
          ]),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Day Closing', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
      ),
      body: Column(children: [
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: cp.items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final item = cp.items[i];
              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE5E7EB))),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(item.productName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
                    const SizedBox(height: 4),
                    Text('System remaining: ${item.systemRemaining}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                    const SizedBox(height: 10),
                    Row(children: [
                      const Text('Return qty:', style: TextStyle(fontSize: 13, color: Color(0xFF374151))),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Color(0xFF4F46E5), size: 22),
                        onPressed: item.enteredReturnQty > 0 ? () => cp.updateQty(item.productId, item.enteredReturnQty - 1) : null,
                      ),
                      SizedBox(
                        width: 36,
                        child: Text('${item.enteredReturnQty}', textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, color: Color(0xFF4F46E5), size: 22),
                        onPressed: item.enteredReturnQty < item.systemRemaining ? () => cp.updateQty(item.productId, item.enteredReturnQty + 1) : null,
                      ),
                    ]),
                  ]),
                ),
              );
            },
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              height: 50,
              width: double.infinity,
              child: ElevatedButton(
                onPressed: cp.submitting ? null : () async {
                  final ok = await cp.submit(session.id);
                  if (!ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cp.error ?? 'Failed'), backgroundColor: const Color(0xFFDC2626)));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: cp.submitting
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Day Closing', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
