import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/truck_service.dart';

class TruckPosScreen extends StatefulWidget {
  final Map<String, dynamic> session;
  const TruckPosScreen({super.key, required this.session});
  @override
  State<TruckPosScreen> createState() => _TruckPosScreenState();
}

class _TruckPosScreenState extends State<TruckPosScreen> {
  List<dynamic> _products = [];
  final Map<int, int> _cart = {}; // productId → quantity
  bool _loading = true;
  bool _saving = false;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    final token = context.read<AuthService>().token!;
    try {
      final data = await TruckService.getProducts(token);
      if (mounted) setState(() { _products = data.where((p) => p['isActive'] == true).toList(); _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _products;
    return _products.where((p) => (p['name'] as String).toLowerCase().contains(_search.toLowerCase())).toList();
  }

  double get _cartTotal => _cart.entries.fold(0.0, (sum, e) {
    final product = _products.firstWhere((p) => p['id'] == e.key, orElse: () => null);
    if (product == null) return sum;
    return sum + (product['sellingPrice'] as num).toDouble() * e.value;
  });

  int get _cartItemCount => _cart.values.fold(0, (s, q) => s + q);

  void _setQty(int productId, int qty) {
    setState(() {
      if (qty <= 0) {
        _cart.remove(productId);
      } else {
        _cart[productId] = qty;
      }
    });
  }

  Future<void> _saveSale() async {
    if (_cart.isEmpty) return;
    setState(() => _saving = true);
    final token = context.read<AuthService>().token!;
    try {
      final items = _cart.entries.map((e) {
        final product = _products.firstWhere((p) => p['id'] == e.key);
        return {
          'productId': e.key,
          'quantity': e.value,
          'price': (product['sellingPrice'] as num).toDouble(),
        };
      }).toList();

      await TruckService.createSale(token, widget.session['id'] as int, items);
      if (!mounted) return;
      setState(() { _cart.clear(); _saving = false; });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sale saved!'), backgroundColor: Colors.green),
      );
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Sale'),
        actions: [
          if (_cartItemCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton.icon(
                onPressed: () => setState(() => _cart.clear()),
                icon: const Icon(Icons.clear_all, color: Colors.red, size: 18),
                label: const Text('Clear', style: TextStyle(color: Colors.red, fontSize: 13)),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search products…',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),

              // Product list
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                  itemCount: _filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, i) {
                    final p = _filtered[i];
                    final pid = p['id'] as int;
                    final qty = _cart[pid] ?? 0;
                    final price = (p['sellingPrice'] as num).toDouble();

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: qty > 0
                            ? cs.primary.withValues(alpha: 0.08)
                            : (isDark ? const Color(0xFF1A2635) : Colors.white),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: qty > 0 ? cs.primary.withValues(alpha: 0.4) : Colors.transparent,
                        ),
                      ),
                      child: Row(children: [
                        // Emoji
                        Text(p['emoji'] as String? ?? '🍦', style: const TextStyle(fontSize: 22)),
                        const SizedBox(width: 10),
                        // Name & price
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(p['name'] as String,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                          Text('₹${price.toStringAsFixed(0)}',
                              style: TextStyle(fontSize: 12, color: cs.primary, fontWeight: FontWeight.w700)),
                        ])),
                        // Quantity controls
                        Row(children: [
                          _qtyButton(Icons.remove, qty > 0 ? () => _setQty(pid, qty - 1) : null, cs),
                          Container(
                            width: 36,
                            alignment: Alignment.center,
                            child: Text('$qty',
                                style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: qty > 0 ? cs.primary : cs.onSurface)),
                          ),
                          _qtyButton(Icons.add, () => _setQty(pid, qty + 1), cs),
                        ]),
                      ]),
                    );
                  },
                ),
              ),
            ]),

      // Cart summary + save button
      bottomNavigationBar: _cart.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0A1219) : Colors.white,
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, -2))],
                ),
                child: Row(children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('$_cartItemCount item${_cartItemCount != 1 ? 's' : ''}',
                        style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
                    Text('₹${_cartTotal.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: cs.primary)),
                  ]),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _saving ? null : _saveSale,
                      icon: _saving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.check_rounded),
                      label: Text(_saving ? 'Saving…' : 'Save Sale'),
                    ),
                  ),
                ]),
              ),
            ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback? onTap, ColorScheme cs) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          color: onTap != null ? cs.primary.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: onTap != null ? cs.primary : cs.onSurface.withValues(alpha: 0.3)),
      ),
    );
  }
}
