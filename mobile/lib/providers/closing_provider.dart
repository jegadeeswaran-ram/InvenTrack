import 'package:flutter/foundation.dart';
import '../models/closing_model.dart';
import '../services/closing_service.dart';

class ClosingProvider extends ChangeNotifier {
  List<ClosingStockItem> _items = [];
  bool _submitting = false;
  bool _submitted  = false;
  String? _error;

  List<ClosingStockItem> get items => _items;
  bool get submitting              => _submitting;
  bool get submitted               => _submitted;
  String? get error                => _error;

  void initFromSession(List<Map<String, dynamic>> dispatches) {
    _items = dispatches
        .map((d) => ClosingStockItem.fromDispatch(d))
        .where((i) => i.systemRemaining >= 0)
        .toList();
    _submitted = false;
    notifyListeners();
  }

  void updateQty(int productId, int qty) {
    final idx = _items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) {
      _items[idx].enteredReturnQty = qty.clamp(0, _items[idx].systemRemaining);
      notifyListeners();
    }
  }

  Future<bool> submit(int sessionId) async {
    _submitting = true;
    _error = null;
    notifyListeners();
    try {
      final stockItems = _items.map((i) => {
        'productId': i.productId,
        'enteredReturnQty': i.enteredReturnQty,
      }).toList();
      await ClosingService.submitClosing(sessionId: sessionId, stockItems: stockItems);
      _submitted = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _submitting = false;
      notifyListeners();
    }
  }
}
