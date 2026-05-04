import 'package:flutter/foundation.dart';
import '../models/sale_model.dart';
import '../services/sales_service.dart';

class SalesProvider extends ChangeNotifier {
  final List<CartEntry> _cart = [];
  List<SaleRecord> _history  = [];
  List<Map<String, dynamic>> _liveStock = [];
  bool _loading  = false;
  bool _submitting = false;
  String? _error;

  List<CartEntry> get cart            => List.unmodifiable(_cart);
  List<SaleRecord> get history        => _history;
  List<Map<String, dynamic>> get liveStock => _liveStock;
  bool get loading                    => _loading;
  bool get submitting                 => _submitting;
  String? get error                   => _error;
  double get cartTotal                => _cart.fold(0, (s, e) => s + e.total);

  Future<void> loadLiveStock(int sessionId) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _liveStock = await SalesService.getLiveStock(sessionId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void addToCart(CartEntry entry) {
    final idx = _cart.indexWhere((c) => c.productId == entry.productId);
    if (idx >= 0) {
      _cart[idx].quantity = entry.quantity;
    } else {
      _cart.add(entry);
    }
    notifyListeners();
  }

  void removeFromCart(int productId) {
    _cart.removeWhere((c) => c.productId == productId);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    notifyListeners();
  }

  Future<bool> submitSale(int sessionId) async {
    if (_cart.isEmpty) return false;
    _submitting = true;
    notifyListeners();
    try {
      final items = _cart.map((c) => {
        'productId': c.productId,
        'quantity': c.quantity,
        'unitPrice': c.unitPrice,
      }).toList();
      await SalesService.recordTruckSale(sessionId: sessionId, items: items);
      clearCart();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _submitting = false;
      notifyListeners();
    }
  }

  Future<void> loadHistory() async {
    _loading = true;
    notifyListeners();
    try {
      _history = await SalesService.getHistory(saleType: 'TRUCK');
    } catch (_) {}
    finally {
      _loading = false;
      notifyListeners();
    }
  }
}
