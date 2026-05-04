import '../config/app_config.dart';
import 'api_service.dart';

class ClosingService {
  static const String _base = '${AppConfig.baseUrl}/closing';

  static Future<Map<String, dynamic>?> getStatus(int sessionId) async {
    try {
      final res = await ApiService.get('$_base/status/$sessionId');
      return res['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  static Future<void> submitClosing({
    required int sessionId,
    required List<Map<String, dynamic>> stockItems,
  }) async {
    await ApiService.post('$_base/submit', {
      'sessionId': sessionId,
      'stockItems': stockItems,
    });
  }
}
