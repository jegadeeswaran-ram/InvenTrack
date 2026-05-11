import 'package:flutter/foundation.dart';
import 'api_service.dart';

class _Perm {
  final bool canView, canCreate, canEdit, canDelete;
  const _Perm({
    required this.canView,
    required this.canCreate,
    required this.canEdit,
    required this.canDelete,
  });
}

class PermissionService extends ChangeNotifier {
  Map<String, _Perm> _map = {};
  bool _loaded = false;

  bool get loaded => _loaded;

  bool canView(String module) => _map[module]?.canView ?? false;
  bool canCreate(String module) => _map[module]?.canCreate ?? false;
  bool canEdit(String module) => _map[module]?.canEdit ?? false;
  bool canDelete(String module) => _map[module]?.canDelete ?? false;

  Future<void> load(String token) async {
    try {
      final data = await ApiService.get('/permissions/me', token: token);
      final Map<String, _Perm> map = {};
      for (final p in data) {
        map[p['module'] as String] = _Perm(
          canView: p['canView'] as bool? ?? false,
          canCreate: p['canCreate'] as bool? ?? false,
          canEdit: p['canEdit'] as bool? ?? false,
          canDelete: p['canDelete'] as bool? ?? false,
        );
      }
      _map = map;
    } catch (_) {
      // fail silently — all permissions default to false
    }
    _loaded = true;
    notifyListeners();
  }

  void clear() {
    _map = {};
    _loaded = false;
    notifyListeners();
  }
}
