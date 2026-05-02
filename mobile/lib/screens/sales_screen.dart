import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/dispatch_provider.dart';
import '../providers/sales_provider.dart';
import '../models/sale_model.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});
  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<DispatchProvider>().session;
      if (session != null) {
        context.read<SalesProvider>().loadLiveStock(session.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final session  = context.watch<DispatchProvider>().session;
    final sp       = context.watch<SalesProvider>();

    if (session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Record Sale')),
        body: const Center(child: Text('No active session')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Record Sale', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
        actions: [
          if (sp.cart.isNotEmpty)
            TextButton.icon(
              icon: const Icon(Icons.shopping_cart_outlined, size: 18),
              label: Text('${sp.cart.length}  ₹${sp.cartTotal.toStringAsFixed(0)}'),
              onPressed: () => _showCartSheet(context, sp, session.id),
            ),
        ],
      ),
      body: sp.loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : sp.liveStock.isEmpty
              ? const Center(child: Text('No stock available', style: TextStyle(color: Color(0xFF6B7280))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: sp.liveStock.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _StockTile(item: sp.liveStock[i], sp: sp),
                ),
    );
  }

  void _showCartSheet(BuildContext context, SalesProvider sp, int sessionId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => ChangeNotifierProvider.value(
        value: sp,
        child: _CartSheet(sessionId: sessionId),
      ),
    );
  }
}

class _StockTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final SalesProvider sp;
  const _StockTile({required this.item, required this.sp});

  @override
  Widget build(BuildContext context) {
    final available = item['availableQty'] as int? ?? 0;
    final price     = double.tryParse(item['unitPrice']?.toString() ?? '0') ?? 0;
    final inCart    = sp.cart.firstWhere((c) => c.productId == item['productId'], orElse: () => CartEntry(productId: -1, productName: '', available: 0, quantity: 0, unitPrice: 0));
    final cartQty   = inCart.productId == -1 ? 0 : inCart.quantity;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE5E7EB))),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item['productName'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
            const SizedBox(height: 2),
            Text('Available: $available  •  ₹${price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          ])),
          if (available > 0)
            Row(children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, size: 22, color: Color(0xFF4F46E5)),
                onPressed: cartQty > 0 ? () {
                  if (cartQty == 1) {
                    sp.removeFromCart(item['productId']);
                  } else {
                    sp.addToCart(CartEntry(productId: item['productId'], productName: item['productName'], available: available, quantity: cartQty - 1, unitPrice: price));
                  }
                } : null,
              ),
              SizedBox(width: 24, child: Text('$cartQty', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)), textAlign: TextAlign.center)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, size: 22, color: Color(0xFF4F46E5)),
                onPressed: cartQty < available ? () {
                  sp.addToCart(CartEntry(productId: item['productId'], productName: item['productName'], available: available, quantity: cartQty + 1, unitPrice: price));
                } : null,
              ),
            ])
          else
            const Text('Out of stock', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
        ]),
      ),
    );
  }
}

class _CartSheet extends StatelessWidget {
  final int sessionId;
  const _CartSheet({required this.sessionId});

  @override
  Widget build(BuildContext context) {
    final sp = context.watch<SalesProvider>();
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              const Text('Cart Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const Spacer(),
              TextButton(onPressed: () { sp.clearCart(); Navigator.pop(context); }, child: const Text('Clear')),
            ]),
            const SizedBox(height: 12),
            ...sp.cart.map((c) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Expanded(child: Text(c.productName, style: const TextStyle(fontSize: 13))),
                Text('${c.quantity} x ₹${c.unitPrice.toStringAsFixed(0)} = ₹${c.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ]),
            )),
            const Divider(height: 20),
            Row(children: [
              const Text('Total', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text('₹${sp.cartTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF4F46E5))),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              height: 46,
              child: ElevatedButton(
                onPressed: sp.submitting ? null : () async {
                  final nav = Navigator.of(context);
                  final ok = await sp.submitSale(sessionId);
                  nav.pop();
                  if (ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sale recorded'), backgroundColor: Color(0xFF059669)));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5), foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                child: sp.submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Confirm Sale', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
