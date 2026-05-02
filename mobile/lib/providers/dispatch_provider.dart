import 'package:flutter/foundation.dart';
import '../models/dispatch_model.dart';
import '../services/dispatch_service.dart';

class DispatchProvider extends ChangeNotifier {
  DispatchSession? _session;
  bool _loading = false;
  String? _error;

  DispatchSession? get session => _session;
  bool get loading             => _loading;
  String? get error            => _error;
  bool get hasSession          => _session != null;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _session = await DispatchService.getMySession();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void clear() {
    _session = null;
    notifyListeners();
  }
}
