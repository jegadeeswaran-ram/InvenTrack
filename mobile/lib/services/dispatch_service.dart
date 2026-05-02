import '../config/app_config.dart';
import '../models/dispatch_model.dart';
import 'api_service.dart';

class DispatchService {
  static const String _base = '${AppConfig.baseUrl}/dispatch';

  static Future<DispatchSession?> getMySession() async {
    try {
      final res = await ApiService.get('$_base/my-session');
      final data = res['data'];
      if (data == null) return null;
      return DispatchSession.fromJson(data);
    } on ApiException catch (e) {
      if (e.message.contains('404') || e.message.toLowerCase().contains('not found')) return null;
      rethrow;
    }
  }

  static Future<List<DispatchSession>> getToday() async {
    final res = await ApiService.get('$_base/today');
    final list = res['data'] as List? ?? [];
    return list.map((j) => DispatchSession.fromJson(j)).toList();
  }
}
